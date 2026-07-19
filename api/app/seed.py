import logging
from datetime import datetime, timedelta, timezone
from pathlib import Path

from alembic import command
from alembic.config import Config
from sqlmodel import select

from app.core.config import get_settings
from app.core.security import hash_password
from app.db import async_session_factory
from app.models.enums import (
    AdvanceMode,
    EventStatus,
    MediaType,
    StageName,
    TopicStatus,
    UserRole,
    UserStatus,
)
from app.models.event import Event
from app.models.event_type import EventType
from app.models.slide import Slide
from app.models.stage import Stage
from app.models.topic import Topic
from app.models.user import User

logger = logging.getLogger(__name__)
settings = get_settings()

_API_ROOT = Path(__file__).resolve().parent.parent
_ALEMBIC_INI = _API_ROOT / "alembic.ini"

ADMIN_EMAIL = "admin@secretwhiz.com"
ADMIN_PASSWORD = "Admin@12345"

_EVENT_TYPES = [
    ("Singing", "Vocal performance competitions.", MediaType.VIDEO),
    ("Dancing", "Dance performance competitions.", MediaType.VIDEO),
    ("Acting", "Short acting/monologue performance competitions.", MediaType.VIDEO),
    ("Photography", "Single-photo submission competitions.", MediaType.IMAGE),
    ("Painting", "Painting/visual art submission competitions.", MediaType.IMAGE),
]

_TOPICS = [
    {
        "key": "whats-new",
        "title": "What's New",
        "subtitle": "Latest updates from Unseen Talents",
        "html_content": "<p>Check back here for the latest news and updates.</p>",
        "featured": False,
    },
    {
        "key": "about-us",
        "title": "About Us",
        "subtitle": "Why Unseen Talents exists",
        "html_content": (
            "<p>Unseentalents.com was created with the simple idea that talented people live everywhere. "
            "Some can afford to go to actual competitions and travel the world showing their talents — "
            "however it is a fact that most cannot. That is why this program was created.</p>"
        ),
        "featured": False,
    },
    {
        "key": "performers",
        "title": "Performers",
        "subtitle": "Get the exposure you deserve",
        "html_content": (
            "<p>As a performer we truly hope you find this an outlet for your creative skills. "
            "Uploading your entry is your chance to show who you are — we do not own your content, "
            "we only present it for others to view and vote on.</p>"
        ),
        "featured": True,
    },
    {
        "key": "talent-lovers",
        "title": "Talent Lovers",
        "subtitle": "Host and judge",
        "html_content": (
            "<p>Love discovering new talent? Browse live competitions, watch entries, and cast your vote "
            "to help decide who advances.</p>"
        ),
        "featured": True,
    },
    {
        "key": "how-it-works",
        "title": "How It Works",
        "subtitle": "Four steps to get discovered",
        "html_content": (
            "<ol>"
            "<li>Register for a free account and pick a competition category — singing, dancing, "
            "acting, photography or painting.</li>"
            "<li>Enter a live competition and upload your video or photo entry before the submission "
            "window closes.</li>"
            "<li>Our team reviews your entry, then it goes public for voting — share it with friends "
            "to rally support.</li>"
            "<li>Top entries advance through each round — Top 50, Top 10, Top 5 — until a winner is "
            "crowned.</li>"
            "</ol>"
        ),
        "featured": False,
    },
    {
        "key": "upcoming-events",
        "title": "Upcoming Events",
        "subtitle": "Don't miss what's next",
        "html_content": (
            "<p>New competitions are added all the time — singing, dancing, acting, photography and "
            "painting. Check the Events menu to see what's live right now and what's coming up next.</p>"
        ),
        "featured": True,
    },
    {
        "key": "terms-and-conditions",
        "title": "Terms and Conditions",
        "subtitle": "Please read before you sign up",
        "html_content": (
            "<p>By creating an account and using Unseen Talents, you agree to the following terms.</p>"
            "<h2>1. Eligibility</h2>"
            "<p>You must provide accurate registration information and are responsible for keeping your "
            "account credentials secure.</p>"
            "<h2>2. Your content</h2>"
            "<p>You retain ownership of everything you upload. By submitting an entry you grant Unseen "
            "Talents a license to display it on the platform for the purposes of the competition, "
            "including public voting.</p>"
            "<h2>3. Fair play</h2>"
            "<p>Vote manipulation, fake accounts, and abusive behavior toward other performers or fans "
            "are not allowed and may result in disqualification or suspension.</p>"
            "<h2>4. Prizes</h2>"
            "<p>Prizes are awarded as described on each event's page. Unseen Talents is not responsible "
            "for delays caused by third-party prize providers (e.g. gift card issuers).</p>"
            "<h2>5. Changes</h2>"
            "<p>We may update these terms from time to time; continued use of the platform after a "
            "change means you accept the updated terms.</p>"
        ),
        "featured": False,
    },
]

_SLIDES = [
    {
        "title": "Dance Like Never Before",
        "subtitle": "Show your rhythm, win the crowd",
        "image_key": "slides/dance.png",
        "order_index": 1,
    },
    {
        "title": "Find Your Voice",
        "subtitle": "Sing your heart out on the big stage",
        "image_key": "slides/singing.png",
        "order_index": 2,
    },
    {
        "title": "Every Talent Has a Stage",
        "subtitle": "Discover competitions across every category",
        "image_key": "slides/photo.jpg",
        "order_index": 3,
    },
]


# Each stage tuple: (name, order_index, start_offset_days, end_offset_days, advance_mode, advance_count)
_EVENTS = [
    {
        "name": "Summer Singing Sensation",
        "description": "Show off your vocal range and win the crowd.",
        "event_type_name": "Singing",
        "stages": [
            (StageName.BACKSTAGE, 1, -2, 7, AdvanceMode.ADMIN_CURATED, None),
            (StageName.MAINSTAGE, 2, 8, 15, AdvanceMode.ADMIN_CURATED, None),
            (StageName.TOP_5, 3, 16, 20, AdvanceMode.ADMIN_CURATED, None),
        ],
    },
    {
        "name": "Rhythm Nation Dance Championship",
        "description": "Bring your best moves to the floor.",
        "event_type_name": "Dancing",
        "stages": [
            (StageName.BACKSTAGE, 1, -1, 10, AdvanceMode.ADMIN_CURATED, None),
            (StageName.MAINSTAGE, 2, 11, 18, AdvanceMode.ADMIN_CURATED, None),
            (StageName.TOP_5, 3, 19, 25, AdvanceMode.ADMIN_CURATED, None),
        ],
    },
    {
        "name": "Spotlight Acting Showcase",
        "description": "A monologue or scene — make us believe it.",
        "event_type_name": "Acting",
        "stages": [
            (StageName.BACKSTAGE, 1, 5, 12, AdvanceMode.ADMIN_CURATED, None),
        ],
    },
    {
        "name": "Frame & Focus Photography Contest",
        "description": "One striking photo, your best shot.",
        "event_type_name": "Photography",
        "stages": [
            (StageName.BACKSTAGE, 1, -3, 4, AdvanceMode.ADMIN_CURATED, None),
        ],
    },
    {
        "name": "Canvas Dreams Painting Contest",
        "description": "Original paintings, any medium.",
        "event_type_name": "Painting",
        "stages": [
            (StageName.BACKSTAGE, 1, -30, -20, AdvanceMode.ADMIN_CURATED, None),
            (StageName.WINNER, 2, -19, -15, AdvanceMode.ADMIN_CURATED, None),
        ],
    },
    {
        "name": "Winter Voices Singing Cup",
        "description": "Our last singing cup of the season.",
        "event_type_name": "Singing",
        "stages": [
            (StageName.BACKSTAGE, 1, -60, -45, AdvanceMode.ADMIN_CURATED, None),
        ],
    },
]


def run_migrations() -> None:
    """Runs synchronously (psycopg2) — called via asyncio.to_thread from the app's async lifespan."""
    cfg = Config(str(_ALEMBIC_INI))
    cfg.set_main_option("script_location", str(_API_ROOT / "app" / "alembic"))
    command.upgrade(cfg, "head")


async def seed_initial_data() -> None:
    async with async_session_factory() as db:
        result = await db.exec(select(User).where(User.email == ADMIN_EMAIL))
        admin = result.first()
        if admin is None:
            admin = User(
                name="Unseen Talents Admin",
                username="admin",
                email=ADMIN_EMAIL,
                password_hash=hash_password(ADMIN_PASSWORD),
                role=UserRole.ADMIN,
                status=UserStatus.ACTIVE,
                credit_balance=0,
            )
            db.add(admin)
            await db.commit()
            await db.refresh(admin)
            logger.info("Seeded admin user %s (password: %s)", ADMIN_EMAIL, ADMIN_PASSWORD)

        for name, description, media_type in _EVENT_TYPES:
            existing = await db.exec(select(EventType).where(EventType.name == name))
            if existing.first() is None:
                db.add(EventType(name=name, description=description, submission_media_type=media_type))
        await db.commit()

        event_types_by_name = {
            et.name: et for et in (await db.exec(select(EventType))).all()
        }

        events_created = 0
        now = datetime.now(timezone.utc)
        for event_data in _EVENTS:
            existing_event = await db.exec(select(Event).where(Event.name == event_data["name"]))
            if existing_event.first() is not None:
                continue

            event_type = event_types_by_name[event_data["event_type_name"]]
            event = Event(
                name=event_data["name"],
                description=event_data["description"],
                event_type_id=event_type.id,
                created_by=admin.id,
                status=EventStatus.PUBLISHED,
            )
            db.add(event)
            await db.flush()

            for stage_name, order_index, start_offset, end_offset, advance_mode, advance_count in event_data[
                "stages"
            ]:
                db.add(
                    Stage(
                        event_id=event.id,
                        name=stage_name,
                        order_index=order_index,
                        start_at=now + timedelta(days=start_offset),
                        end_at=now + timedelta(days=end_offset),
                        advance_mode=advance_mode,
                        advance_count=advance_count,
                    )
                )
            events_created += 1
        await db.commit()

        for topic_data in _TOPICS:
            existing_topic = await db.exec(select(Topic).where(Topic.key == topic_data["key"]))
            if existing_topic.first() is None:
                db.add(Topic(**topic_data, status=TopicStatus.PUBLISHED, created_by=admin.id))

        for slide_data in _SLIDES:
            existing_slide = await db.exec(select(Slide).where(Slide.image_key == slide_data["image_key"]))
            if existing_slide.first() is None:
                db.add(Slide(**slide_data, active=True, created_by=admin.id))

        await db.commit()
        logger.info(
            "Seed check complete — %d event types, %d events created, %d topics, %d slides ensured.",
            len(_EVENT_TYPES),
            events_created,
            len(_TOPICS),
            len(_SLIDES),
        )
