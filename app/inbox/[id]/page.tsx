import { EmailView } from "@/components/inbox"

export default async function EmailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return <EmailView id={id} />
}
