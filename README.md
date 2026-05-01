# Interface — Portfolio Site

Static multi-page portfolio site for Interface design studio. Drop the contents of this folder into a GitHub repo and enable GitHub Pages — that's it.

## Files

```
.
├── index.html              # WEB page — project showcase (home)
├── about.html              # ABOUT page — bio, contact, skills
├── quote.html              # QUOTE page — project enquiry form
├── style.css               # Shared stylesheet
├── script.js               # Shared JS (cursor + loader + nav + form)
├── robots.txt              # Search engine crawler rules
├── sitemap.xml             # SEO sitemap
├── .nojekyll               # Tells GitHub Pages to skip Jekyll processing
└── assets/
    ├── img/
    │   └── logo.svg        # Site logo (loops)
    └── videos/
        ├── bluff_hero.mp4
        ├── mere_landing.mp4
        ├── mere_product.mp4
        ├── mere_ocean.mp4
        └── pub_hero.mp4
```

## Before you deploy

1. **Replace the placeholder URL.** Find-and-replace `https://www.dylandriscoll.design` across all `.html` files with your real domain.
2. **Wire up the quote form.** In `quote.html`, replace the Formspree endpoint `xpwlrpwk` in the form's `action` URL with your own:
   - Sign up at [formspree.io](https://formspree.io)
   - Create a new form and copy your endpoint code
   - Replace `https://formspree.io/f/xpwlrpwk` with `https://formspree.io/f/yourcode`

## Deploy to GitHub Pages

1. Create a new repo on GitHub (e.g. `dylandriscoll.github.io` or any name).
2. Drag the contents of this folder (not the folder itself) into the repo.
3. In the repo's **Settings → Pages**, set source to `main` branch, root folder.
4. Wait ~1 minute. Site goes live at `https://yourusername.github.io/reponame/` (or your custom domain if set up).

## Custom domain (optional)

In the repo, create a file called `CNAME` containing your domain (e.g. `dylandriscoll.design`), then point your DNS A records to GitHub's IPs (185.199.108.153 etc — Google "GitHub Pages custom domain" for the latest list).
