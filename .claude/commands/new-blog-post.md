Create a new blog post:

1. Pick the number: list `content/blog/` (including the dot-prefixed drafts) and take the lowest number in use minus one — lower is newer.
2. Ask for: title, description, estimated read time, slug.
3. Create the draft as `content/blog/.{number}.{slug}.md` (the leading dot keeps it out of the build; drop it to publish) with this frontmatter:

   ```yaml
   ---
   title: "…"
   description: "…"
   minRead: 5
   date: YYYY-MM-DD
   image:
     src: /images/blog/{number}.{slug}/hero.png
     height: 300
   author:
     name: Wouter Vernaillen
     description: Full Stack Developer
     avatar:
       src: /images/woutervernaillen.jpg
       alt: Wouter Vernaillen
   ---
   ```

4. Create the image directory `src/assets/images/blog/{number}.{slug}/` (rasters live there, never in `public/`; the content keeps referencing them as `/images/blog/…`).
5. Add an introductory paragraph placeholder and a first `##` heading.
