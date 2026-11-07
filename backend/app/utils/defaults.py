"""Default categories seeded for every new user, per the product spec."""

DEFAULT_CATEGORIES = [
    {"name": "Personal", "icon": "user", "color": "#8B9CF7", "is_default": True},
    {"name": "Work", "icon": "briefcase", "color": "#5AC8FA", "is_default": True},
    {"name": "Study", "icon": "book", "color": "#34C759", "is_default": True},
    {"name": "Finance", "icon": "dollar-sign", "color": "#FFB020", "is_default": True},
    {"name": "Important Documents", "icon": "file-text", "color": "#FF6B6B", "is_default": True},
    {"name": "Health Information", "icon": "heart", "color": "#FF2D55", "is_default": True, "is_sensitive": True},
    {"name": "Travel", "icon": "map-pin", "color": "#32ADE6", "is_default": True},
    {"name": "Ideas", "icon": "lightbulb", "color": "#AF52DE", "is_default": True},
    {"name": "Relationships", "icon": "users", "color": "#FF9F0A", "is_default": True, "is_sensitive": True},
    {"name": "Tasks", "icon": "check-square", "color": "#30D158", "is_default": True},
    {"name": "Other", "icon": "folder", "color": "#8E8E93", "is_default": True},
]
