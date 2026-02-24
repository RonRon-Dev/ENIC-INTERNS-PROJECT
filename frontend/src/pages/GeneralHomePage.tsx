import {
    Card,
    CardDescription,
    CardTitle,
} from "@/components/ui/card"
import { BadgeDollarSignIcon, Building, CirclePile, FileDigit, FolderOpen, GitGraph, HandshakeIcon, HardHat, Link, Settings } from "lucide-react"

const tools = [
    {
        title: "Accounting Automation",
        description: "Automate journal entries and financial workflows.",
        icon: BadgeDollarSignIcon,
    },
    {
        title: "Inventory Management",
        description: "Track stock levels and warehouse movement.",
        icon: CirclePile,
    },
    {
        title: "Operations Center",
        description: "Monitor daily operational performance.",
        icon: HardHat,
    },
    {
        title: "HR Management",
        description: "Manage employees, attendance, and records.",
        icon: HandshakeIcon,
    },
    {
        title: "Reports & Analytics",
        description: "Generate insights and export reports.",
        icon: GitGraph,
    },
    {
        title: "Procurement",
        description: "Handle purchase orders and vendor tracking.",
        icon: Building,
    },
    {
        title: "CRM",
        description: "Manage clients and customer relationships.",
        icon: Link,
    },
    {
        title: "Project Management",
        description: "Track milestones and project progress.",
        icon: FolderOpen,
    },
    {
        title: "System Settings",
        description: "Configure platform preferences and controls.",
        icon: Settings,
    },
    {
        title: "Audit Logs",
        description: "Review system activities and changes.",
        icon: FileDigit,
    },
]


export default function GeneralHomePage() {
    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="mb-20">
                <h1 className="text-3xl font-light italic">Welcome back, <span className="font-black">Mr. Charles!</span>  </h1>
                <p className="ml-1 text-muted-foreground">Eurolink Network International Corporation</p>
            </div>


            <div className="flex flex-col gap-4">
                <p className="text-muted-foreground">
                    Select a tool to continue.
                </p>
                {/* Grid */}
                <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3">
                    {tools.map((tool, index) => (
                        <Card
                            key={index}
                            className="flex items-center gap-4 p-5 hover:bg-muted/60 transition-all duration-200 cursor-pointer rounded-xl hover:border-gray-500"
                        >
                            {/* Icon */}
                            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted">
                                {(() => {
                                    const Icon = tool.icon
                                    return <Icon className="h-6 w-6" />
                                })()}
                            </div>


                            {/* Content */}
                            <div className="flex flex-col">
                                <CardTitle className="text-base">{tool.title}</CardTitle>
                                <CardDescription className="text-sm ">
                                    {tool.description}
                                </CardDescription>
                            </div>
                        </Card>
                    ))}
                </div>
            </div>
        </div>
    )
}