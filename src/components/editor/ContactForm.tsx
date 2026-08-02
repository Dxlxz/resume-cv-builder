import { useDocumentStore } from '@/app/store/documentStore'
import { TextField } from '@/components/ui/TextField'
import { CatalogPicker } from '@/components/catalog/CatalogPicker'
import { FORM_PLACEHOLDERS } from '@/lib/formPlaceholders'

export function ContactForm() {
  const contact = useDocumentStore((s) => s.document?.contact)
  const errors = useDocumentStore((s) => s.exportFieldErrors)
  const updateContact = useDocumentStore((s) => s.updateContact)

  if (!contact) return null

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <TextField
        id="contact-full-name"
        label="Full name"
        required
        placeholder={FORM_PLACEHOLDERS.contact.fullName}
        value={contact.fullName}
        error={errors.fullName}
        onChange={(e) => updateContact({ ...contact, fullName: e.target.value })}
      />
      <TextField
        label="Headline"
        placeholder={FORM_PLACEHOLDERS.contact.headline}
        value={contact.headline ?? ''}
        onChange={(e) => updateContact({ ...contact, headline: e.target.value })}
      />
      <TextField
        id="contact-email"
        label="Email"
        type="email"
        required
        placeholder={FORM_PLACEHOLDERS.contact.email}
        value={contact.email}
        error={errors.email}
        onChange={(e) => updateContact({ ...contact, email: e.target.value })}
      />
      <TextField
        label="Phone"
        placeholder={FORM_PLACEHOLDERS.contact.phone}
        value={contact.phone ?? ''}
        onChange={(e) => updateContact({ ...contact, phone: e.target.value })}
      />
      <CatalogPicker
        id="contact-location"
        catalogType="location"
        label="Location"
        placeholder={FORM_PLACEHOLDERS.contact.location}
        value={contact.location ?? ''}
        onChange={(location) => updateContact({ ...contact, location })}
      />
      <TextField
        label="LinkedIn URL"
        placeholder={FORM_PLACEHOLDERS.contact.linkedIn}
        value={contact.linkedIn ?? ''}
        onChange={(e) => updateContact({ ...contact, linkedIn: e.target.value })}
      />
      <TextField
        label="Website"
        placeholder={FORM_PLACEHOLDERS.contact.website}
        value={contact.website ?? ''}
        onChange={(e) => updateContact({ ...contact, website: e.target.value })}
      />
    </div>
  )
}
