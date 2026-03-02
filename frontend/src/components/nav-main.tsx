"use client";

import { ChevronDown, ChevronRight, type LucideIcon } from "lucide-react";
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
                    <Collapsible className="group/collapsible">
                      {/* Trigger (Whole Row) */}
                      <CollapsibleTrigger asChild>
                        <div className="flex items-center justify-between w-full">

                          <SidebarMenuButton
                            tooltip={item.title}
                            className="transition-all duration-300 ease-in-out
                   data-[active=true]:bg-gray-800
                   data-[active=true]:text-white
                   hover:bg-muted/50 cursor-default"
                          >
                            <item.icon className="transition-transform duration-300 ease-in-out" />
                            <span>{item.title}</span>
                            <ChevronDown className="size-4 ml-auto transition-transform group-data-[state=open]/collapsible:rotate-180" />
                          </SidebarMenuButton>



                        </div>
                      </CollapsibleTrigger>

                      {/* Content */}
                      <CollapsibleContent>
                        <SidebarMenuSub>
                          {item.items?.map((subItem) => (
                            <SidebarMenuSubItem key={subItem.title}>
                              <SidebarMenuSubButton
                                asChild
                                isActive={location.pathname === subItem.url}
                                className="transition-all duration-200 ease-in-out
                       data-[active=true]:bg-gray-800
                       data-[active=true]:text-white"
                              >
                                <NavLink to={subItem.url}>
                                  <span>{subItem.title}</span>
                                </NavLink>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          ))}
                        </SidebarMenuSub>
                      </CollapsibleContent>
                    </Collapsible>
                  </>
                ) :
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
                }
              </SidebarMenuItem>
            </Collapsible>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}
