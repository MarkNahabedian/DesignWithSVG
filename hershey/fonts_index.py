# Make an index.html file for the checked in font files.
#
# run as
#
#   python fonts_index.py

import os
import os.path
import re
from git import Repo
from yattag import Doc


INDEX_FILE_NAME = "index.html"
TEXT_FILE_NAME = "fonts.txt"

FONT_FILE_RE = re.compile("(?P<fontname>[A-Za-z0-9_-]+)-cleaned_up[.]json$")

def list_fonts(repo):
    fonts = []
    tree = repo.heads.master.commit.tree
    for entry in tree / 'hershey' / 'fonts':
        filename = os.path.basename(entry.path)
        m = FONT_FILE_RE.match(filename)
        if m is None: continue
        fonts.append(m.group('fontname'))
    return fonts

def sample_html_file(fontname):
    return fontname + '.html'

def find_my_repository():
    here = os.path.dirname(os.path.abspath(__file__))
    def look_here(p):
        if len(p) < 2:
            return here
        if os.path.isdir(os.path.join(p, '.git')):
            return p
        return look_here(os.path.dirname(p))
    return look_here(here)

def fonts_dir():
    return os.path.join(find_my_repository(), 'hershey', 'fonts')

def main():
    repo = Repo(find_my_repository())
    assert not repo.bare
    fonts = list_fonts(repo)
    doc, tag, text = Doc().tagtext()
    with tag('HTML'):
        with tag('HEAD'):
            with tag('TITLE'):
                text('Available Hershey Fonts')
        with tag('BODY'):
            with tag('H1'):
                text('Available Hershey Fonts')
            with tag('ul'):
                for font in fonts:
                    with tag('LI'):
                        with tag('A', href=sample_html_file(font)):
                            text(font)
    with open(os.path.join(fonts_dir(), INDEX_FILE_NAME), 'w') as out:
        out.write(doc.getvalue())
    with open(os.path.join(fonts_dir(), TEXT_FILE_NAME), 'w') as out:
        for font in fonts:
            out.write(font + '\n')
    

if __name__ == "__main__":
    main()

