import ApplicationsPipelinePage from "./ApplicationsPipelinePage";

/** Walk-in / staff-entered admission applications (source: internal). Not campus visitors. */
export default function OfflineApplicantsPage() {
  return <ApplicationsPipelinePage variant="offline" />;
}
