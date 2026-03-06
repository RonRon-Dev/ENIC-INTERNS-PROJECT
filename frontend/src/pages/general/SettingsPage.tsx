import { Separator } from '@/components/ui/separator';
import { Outlet } from 'react-router-dom';
import { Monitor, Wrench } from 'lucide-react'
import { SidebarNav } from '@/components/sidebar-nav';

const sidebarNavItems = [
    {
        title: 'Account',
        href: '/settings/account',
        icon: <Wrench size={18} />,
    },
    {
        title: 'Preferences',
        href: '/settings/preferences',
        icon: <Monitor size={18} />,
    },
]

export default function SettingsPage() {
    return (
        <>
            <div className='space-y-0.5'>
                <h1 className='text-2xl font-bold tracking-tight md:text-3xl'>
                    Settings
                </h1>
                <p className='text-muted-foreground'>
                    Manage your account settings and set e-mail preferences.
                </p>
            </div>
            <Separator className='my-4 lg:my-6' />
            <div className='flex flex-1 flex-col space-y-2 overflow-hidden md:space-y-2 lg:flex-row lg:space-y-0 lg:space-x-12'>
                <aside className='top-0 lg:sticky lg:w-1/5'>
                    <SidebarNav items={sidebarNavItems} />
                </aside>

                <Separator className="my-6 md:hidden" />

                <div className="flex-1 md:max-w-2xl">
                    <section className="max-w-xl space-y-12"><Outlet /></section>
                </div>
            </div>
        </>
    );
}