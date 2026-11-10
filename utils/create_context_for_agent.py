import os

REQUEST = """
Write the global prescriptions page (showing all prescriptions in the clinic).
Allow searching on the prescriptions based on medications, patient name, or notes.
Do not allow creating another prescription.
Create a compact form of the Viewable Prescription (with the name of the patient) and use it here.
"""


FILES_DESCRIPTION = dict(
    DATABASE_FILES=[],
    HELPER_COMPONENTS_FILES=[
        r"frontend\src\components\prescriptions\ViewPrescription.tsx",
    ],
    TYPES_FILES=[
        r"frontend\src\types\prescription.ts",
        r"frontend\src\types\patient.ts",
    ],
    QUERY_FILES=[r"frontend\src\hooks\usePrescriptions.ts"],
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
