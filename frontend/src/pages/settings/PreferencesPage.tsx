import { Separator } from '@/components/ui/separator'
import { PreferencesForm } from '@/pages/settings/preferences-form'

export default function PreferencesPage() {
  return (
    <div className='space-y-6'>
      <div>
        <h3 className='text-lg font-medium'>Preferences</h3>
        <p className='text-sm text-muted-foreground'>
          Update your preference settings and manage your profile information.
        </p>
      </div>
      <Separator />
      <PreferencesForm />
    </div>
  )
}