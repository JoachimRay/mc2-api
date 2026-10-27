import { ClientLedgerDetail } from "./client-detail";

type Props = { params: Promise<{ slug: string }> };

export default async function ProjectPage({ params }: Props) {
  const { slug } = await params;
  return <ClientLedgerDetail id={slug} />;
}
