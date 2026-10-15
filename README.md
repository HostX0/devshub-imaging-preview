<p align="center">
  <img src="public/icon.svg" alt="DevsHub" width="72" height="72" />
</p>

<h1 align="center">DevsHub Imaging</h1>

<p align="center">One complete result. Every source, preserved.</p>

<p align="center">
  <a href="https://devshub-imaging-demo.vercel.app">Explore the live preview</a>
  ·
  <a href="https://devshub-imaging-demo.vercel.app/product-guide.pdf">Read the product guide</a>
  ·
  <a href="https://github.com/HostX0/devshub-imaging-preview">Public repository</a>
</p>

> [!IMPORTANT]
> **INTERACTIVE FRONTEND PREVIEW ONLY.** This repository demonstrates the DevsHub Imaging user experience with synthetic sample data. The complete system, backend, database, clinical authentication and production clinical image viewer are **not included**. To obtain the complete system or discuss a deployment, contact the account owner through the [HostX0 GitHub profile](https://github.com/HostX0).

## The product

Imaging results often reach care teams as separate reports, images and messages. A useful handoff needs more than a file: the sending center, reviewed patient identity, complete source set, intended doctor and patient documents all need clear context.

DevsHub Imaging demonstrates a connected workflow for imaging centers, referring doctors, patients and administrators. The experience brings received content into one reviewed package per person, keeps visit history organized and separates original sources from private authored notes and patient PDF access. Human review remains part of the journey before a package is sent.

This standalone preview lets visitors explore that experience without an account or external service setup. It is intended for product evaluation, demonstrations and discussion of the complete system.

## Four connected experiences

| Role                 | What you can explore                                                                                                                                                |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Imaging center**   | Review an individual intake or a group of person cards, resume saved drafts, select a referring doctor, send complete sample packages and manage patient history.   |
| **Referring doctor** | Switch between sample doctor identities, search eligible results, open documents, explore synthetic imaging, review patient visits and append private sample notes. |
| **Patient**          | Open a ready sample result without signing in, preview and download its complete printable PDF or numbered PDF parts, and use the browser print action.             |
| **Administrator**    | Explore center information, sample accounts, permissions, patient fields, package grants, visibility, record recovery, audit events and operational readiness.      |

Role switching makes the relationship between these experiences easy to follow. The roles are local demonstration views, not authenticated accounts or a production security boundary.

## Suggested walkthrough

1. Open the [live preview](https://devshub-imaging-demo.vercel.app) and choose **Imaging center**.
2. Start **New patient intake**, create a draft and add a built-in sample package.
3. Review the person's details, choose a new or existing profile and select a linked doctor.
4. Confirm the patient identity and ownership of every listed source, then send the complete package.
5. Switch to **Referring doctor** and select the recipient to find the delivered result. Open its report, try the reader and add a sample private note.
6. Preview the patient result, download its PDF and generate a branded sample QR card.
7. Explore **Administrator** to see how fields, grants, visibility and lifecycle actions affect the sample workspace. Use **Reset demo** when you want to return to the starting records.

## Feature catalogue

### Individual intake and explicit review

- Create separate intake drafts with an examination title, full name, supplied age and age unit.
- Link an intake to an existing patient profile or review it as a new person. Similar names do not merge automatically.
- Complete optional or configured fields such as phone number, date of birth and preliminary diagnosis.
- Add built-in synthetic MRI, ultrasound and report sources, or select sample files from your device. Local files are limited to 25 MB each.
- Inspect the source list and available previews before confirming ownership. Files that the preview cannot decode remain clearly identified as unsupported.
- Select a currently linked and available doctor. Confirm both demographics and the complete source set before sending.
- Editing the person, recipient or sources clears the previous approval and requires another review.
- Resume multiple saved drafts. Saving a draft alone does not deliver a result or create a patient share.

### Bulk workspace

The bulk workspace keeps a separate person card for each intake. Every card has its own identity, source list, referring doctor and review status.

Visitors can add cards, open their intake details, assign doctors and approve each complete person package. A reviewed bulk action sends eligible cards while unresolved cards remain held for review. Editing a shared doctor assignment requires the affected cards to be reviewed again. Files are not automatically split, matched or assigned to people.

### Results, patient profiles and visit history

- Search patient profiles and results by their reviewed details and stable sample references.
- See the sending center, primary doctor, version, date, source manifest and printable status on a result.
- Keep each examination as a separate visit while exploring a patient's retained history.
- Create a standalone patient profile without delivering a visit or generating a QR card.
- Review a deliberate profile merge with a reason and identity confirmation. Original visit associations and doctor access remain separate from the alias relationship.
- Explore merge history and administrator review of a reversal.
- Start a correction as a new draft instead of silently rewriting a delivered package.
- Withdraw a complete package to stop its ordinary sample doctor and patient views.
- Use in-app sample notifications to open relevant results and mark events as read.

### Doctor inbox and private notes

The doctor experience filters results and patient history according to the selected sample doctor's current grants and profile visibility. Linking a doctor to a center does not automatically grant earlier visits.

Doctors can append dated notes to eligible examinations and review their authored note history. Notes stay separate from received documents and are excluded from patient PDFs and QR handoffs. These are simulated visibility rules within one browser; the preview does not provide protected storage for confidential notes.

### Synthetic imaging reader

The reader provides interactive controls around generated MRI and ultrasound sample pixels:

- Frame navigation, a frame slider, mouse-wheel navigation and cine playback.
- Window/level interaction, brightness and contrast presets.
- Zoom, pan, rotation, horizontal and vertical flip, inversion and display reset.
- Temporary length, angle and region-of-interest annotations, with a clear-measurements action.
- Illustrative stack, MPR, MIP and 3D modes for the MRI sample when enabled.
- Download of the current synthetic sample frame.

The reader does not parse real DICOM files, extract patient metadata or reconstruct a clinical volume. Spatial modes are illustrations, and measurement values are uncalibrated sample units. Annotations are temporary and are not written into original files.

### Patient PDFs and QR cards

Built-in sample packages can produce complete printable output with ordered coverage of their report pages and synthetic imaging frames. The patient view provides PDF previews, downloads, numbered parts when the configured page limit is exceeded, and a browser print action. Incomplete or unsupported output remains unavailable rather than appearing as a ready partial result.

Generated PDFs and QR cards carry the DevsHub identity and visible sample-data labels. A selected standalone local PDF can be opened or downloaded as its original bytes; it is not rewritten or branded by the preview. Combining arbitrary local sources into a complete printable package is outside this demo.

The downloaded QR card includes patient context and a sample route. Seeded examples can be explored in another browser, but custom records exist only in the browser where they were created. A QR code does not transfer those records or local files, and it is not a secure cross-device clinical share. The preview does not send WhatsApp messages, email or other external communications.

### Administration and configuration

| Area                             | Demonstrated controls                                                                                                                                                               |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Centers and doctor directory** | Review center context, search and link sample doctor identities, create a local sample doctor and change directory availability.                                                    |
| **Staff accounts**               | Add sample staff identities and explore activation or deactivation controls without creating real credentials.                                                                      |
| **Permissions**                  | Review selected actions and resource scope for a sample account. Permanent purge authority is not offered as a delegated permission.                                                |
| **Patient fields**               | Change labels, visibility and requiredness, add optional fields and publish local sample field settings. Identity and source review remain explicit.                                |
| **Package access**               | Grant, hide or revoke selected doctors' access to a chosen complete package or all current confirmed packages. Future visits are excluded.                                          |
| **Profile visibility**           | Hide a patient for selected doctors or all doctors, then restore visibility separately from revoked grants.                                                                         |
| **Record lifecycle**             | Demonstrate deletion, retained-record restoration and administrator purge with explicit confirmations. Recovery policy is configurable; there is no background retention scheduler. |
| **Audit trail**                  | Browse locally recorded sample actions, affected records and timestamps. This is not a production audit service.                                                                    |
| **Operations**                   | Compare original delivery with patient PDF readiness and inspect unavailable output. No external processing workers run.                                                            |
| **Source integrations**          | Browse simulated Orthanc, DICOMweb and worklist catalogs, then create an unsent review draft. No live connector is contacted.                                                       |
| **Settings**                     | Change center presentation, the displayed recovery policy, PDF part size and feature switches for notes, sharing, advanced views, doctor creation and integrations.                 |

## Data, privacy and reset

Use synthetic names and sample files only. The initial records contain no real patient information or clinical findings.

- Demo records, entered details, notes and local file metadata are saved in browser storage on this device.
- Selected file contents remain in the current tab's memory and are never uploaded by the application. After refreshing or reopening, reselect the same file to restore access to its bytes.
- Browser changes are not synchronized with another device or visitor. The application has no backend, database connection or environment credentials.
- **Reset demo**, available in the workspace header, restores the initial records and clears the preview's selected local files. Previously downloaded files remain on your device.
- Clearing site storage also removes locally saved demo changes.

The full system's authentication, protected clinical storage, authorization enforcement, retention services and production integrations are not part of this public preview.

## Responsive DevsHub experience

The interface adapts to desktop, tablet and phone layouts, including mobile navigation, result pages and reader controls. Keyboard focus states, labeled controls, modal dialogs and reduced-motion styling support exploration across different interaction preferences.

The visual identity uses the original DevsHub D mark, midnight framing, paper surfaces and indigo emphasis. The same identity appears across the welcome experience, workspaces, patient pages and generated sample documents.

## Run locally

Use **Node.js 24** and **pnpm 10.30.3**. No backend setup or environment variables are required.

```sh
git clone https://github.com/HostX0/devshub-imaging-preview.git
cd devshub-imaging-preview
pnpm install --frozen-lockfile
pnpm run dev
```

Open the local address printed by Vite. To build and inspect the static production version:

```sh
pnpm run build
pnpm run preview
```

### Development checks

```sh
pnpm run typecheck
pnpm test
pnpm run format:check
pnpm exec playwright install --no-shell chromium
pnpm run test:browser
```

Browser checks use one worker and start the local server automatically. To run them against a deployed preview:

```sh
PREVIEW_URL=https://devshub-imaging-demo.vercel.app pnpm run test:browser
```

## Technology and deployment

| Purpose            | Technology                                        |
| ------------------ | ------------------------------------------------- |
| Application        | React 19, TypeScript and Vite                     |
| Interface          | Responsive CSS, Radix UI dialogs and Lucide icons |
| Sample exports     | jsPDF, QRCode and browser canvas                  |
| Local state        | Browser storage and in-memory file references     |
| Development checks | Vitest, Playwright, axe-core and Prettier         |
| Hosting            | Static deployment on Vercel                       |

The repository is a standalone frontend project. Vercel uses `pnpm install --frozen-lockfile`, builds with `pnpm run build` and serves the generated `dist` directory. The product guide is available from the live preview. GitHub verification checks the frontend on pushes and pull requests. The connected Vercel project automatically publishes updates from the main branch and creates preview deployments for other branches.

## Obtain the complete system

This public repository is the interactive preview. For the complete DevsHub Imaging system, backend services, deployment requirements or a product discussion, contact the account owner through the [HostX0 GitHub profile](https://github.com/HostX0).
