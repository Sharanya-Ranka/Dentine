import os

REQUEST = """
Write the email_belongs_to_user sql function. Use auth id to lookup the email and compare that against the one provided.
See the usecase below.

CREATE POLICY "Users can view clinic invitations issued to them" ON "public"."invitation"
  FOR SELECT
  TO "authenticated"
  USING (public.email_belongs_to_user(auth.uid(), invitee_email));

Also create 2 invitation hooks (useGetInvitationsBy, useGetInvitationsFor) to return invitations by a user (populated in an admin page), and for a user (through email, populated on personal page).

Extend the personal page (currently stored within components/user, but will shift) frontend by having a section called "Invitations for you"

Use components to render invitations (row cards / list item cards), with the ability to accept or decline them.
Components are at frontend\\src\\components\\invitation
"""


FILES_DESCRIPTION = dict(
    DATABASE_FILES=[
        r"supabase\schemas\public\tables\invitation.sql",
        r"supabase\schemas\public\tables\app_user.sql",
    ],
    TYPES_FILES=[],
    QUERY_FILES=[r"frontend\src\hooks\useInvitations.ts"],
    HELPER_COMPONENTS_FILES=[],
    PAGE_FILES=[r"frontend\src\components\user\DashboardView.tsx"],
)


for segment, filepaths in FILES_DESCRIPTION.items():
    if not isinstance(filepaths, list) or len(filepaths) == 0:
        continue

    all_file_contents = {}
    for filepath in filepaths:
        with open(filepath, "r") as fp:
            all_file_contents[filepath] = "".join(fp.readlines())

    all_file_contents_str = "\n\n".join(
        [
            f"{filepath}\n{file_contents}"
            for filepath, file_contents in all_file_contents.items()
        ]
    )
    # breakpoint()
    REQUEST = REQUEST + f"\n\n{segment}\n" + all_file_contents_str


WRITE_FILE = "temp/context_file.txt"
with open(WRITE_FILE, "w") as fp:
    fp.write(REQUEST)
