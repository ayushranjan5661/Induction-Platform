# toon-avatars — Claude Code skill

Generates animated 2D cartoon characters (SVG, PNG, GIF, MP4, WebM, sprite sheets) in one consistent style.

## Install

Project-only (shared with your team through git):

    mkdir -p .claude/skills && unzip toon-avatars.zip -d .claude/skills/

For all your projects:

    mkdir -p ~/.claude/skills && unzip toon-avatars.zip -d ~/.claude/skills/

Then, once per machine, for PNG/GIF/video export:

    pip install -r .claude/skills/toon-avatars/scripts/requirements.txt
    python -m playwright install chromium
    # plus ffmpeg for GIF / MP4 / WebM

## Use

Just ask Claude Code, for example:

- "Create avatars for our 6 team members for the About page" (then describe them)
- "Generate 20 random, all-different placeholder user avatars with an <Avatar> component"
- "Make 5 villager NPCs as transparent sprite sheets for Godot"
- "Recolour Maya's jacket to teal and re-export the GIF"

Or run the scripts yourself:

    python .claude/skills/toon-avatars/scripts/generate.py --preset all --out avatars/svg
    python .claude/skills/toon-avatars/scripts/render.py "avatars/svg/*.svg" --formats png,gif --out avatars/render

See SKILL.md for the workflow and references/ for every option.
