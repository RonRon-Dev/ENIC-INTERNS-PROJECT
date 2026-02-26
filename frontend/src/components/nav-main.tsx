"use client";

import { ChevronRight, type LucideIcon } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";

export function NavMain({
  items,
}: {
  items: {
    title: string;
    url: string;
    icon: LucideIcon;
    isActive?: boolean;
    items?: {
      title: string;
      url: string;
    }[];
  }[];
}) {
  const location = useLocation();

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Tools</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => {
          const isParentActive = location.pathname === item.url;
          const isChildActive = item.items?.some(
            (sub) => location.pathname === sub.url
          );
          const shouldHighlight = isParentActive || isChildActive;

          const isTriggerOnly = !item.url || item.url === "#";

          return (
            <Collapsible
              key={item.title}
              asChild
              defaultOpen={item.isActive || isChildActive}
            >
              <SidebarMenuItem className="group/menu-item">
                {/* {isTriggerOnly ? (
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton
                      tooltip={item.title}
                      isActive={shouldHighlight}
                      className="transition-all duration-300 ease-in-out data-[active=true]:bg-gray-800 data-[active=true]:text-white hover:bg-muted/50 cursor-pointer"
                    >
                      <item.icon className="transition-transform duration-300 ease-in-out" />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                ) : (
                  <SidebarMenuButton
                    asChild
                    tooltip={item.title}
                    isActive={shouldHighlight}
                    className="transition-all duration-300 ease-in-out data-[active=true]:bg-gray-800 data-[active=true]:text-white hover:bg-muted/50"
                  >
                    <NavLink to={item.url}>
                      <item.icon className="transition-transform duration-300 ease-in-out" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                )} */}

                {item.items?.length ? (
                  <>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton
                        tooltip={item.title}
                        isActive={shouldHighlight}
                        className="transition-all duration-300 ease-in-out data-[active=true]:bg-gray-800 data-[active=true]:text-white hover:bg-muted/50 cursor-pointer"
                      >
                        <item.icon className="transition-transform duration-300 ease-in-out" />
                        <span>{item.title}</span>
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuAction
                        className={cn(
                          "transition-all duration-300 ease-in-out data-[state=open]:rotate-90",
                          shouldHighlight
                            ? "!text-white/70 group-hover/menu-item:!text-white hover:!bg-white/10"
                            : "text-muted-foreground"
                        )}
                      >
                        <ChevronRight className="size-4" />
                        <span className="sr-only">Toggle</span>
                      </SidebarMenuAction>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {item.items?.map((subItem) => (
                          <SidebarMenuSubItem key={subItem.title}>
                            <SidebarMenuSubButton
                              asChild
                              isActive={location.pathname === subItem.url}
                              className="transition-all duration-200 ease-in-out"
                            >
                              <NavLink to={subItem.url}>
                                <span>{subItem.title}</span>
                              </NavLink>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ))}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </>
                ) : <SidebarMenuButton
                  asChild
                  tooltip={item.title}
                  isActive={shouldHighlight}
                  className="transition-all duration-300 ease-in-out data-[active=true]:bg-gray-800 data-[active=true]:text-white hover:bg-muted/50"
                >
                  <NavLink to={item.url}>
                    <item.icon className="transition-transform duration-300 ease-in-out" />
                    <span>{item.title}</span>
                  </NavLink>
                </SidebarMenuButton>}
              </SidebarMenuItem>
            </Collapsible>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}
