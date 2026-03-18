import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { toolsData } from "@/data/tools";
import { usePagePrivileges } from "@/hooks/use-page-privileges";
import { notifToast } from "@/lib/notifToast";
import { cn } from "@/lib/utils";
import { pagePrivilegesApi } from "@/services/pagePrivileges";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Check,
  ChevronDown,
  ChevronRight,
  Code,
  Cpu,
  FileText,
  HardHat,
  LayoutGrid,
  List,
  Megaphone,
  Minus,
  Settings,
  Shield,
  ShieldCheck,
  User,
  UserCheck,
  Users,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useUsers } from "./users-provider";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

type PageEntry = {
  title: string;
  url: string;
  allowedRoles: string[];
  parent?: string;
};

type Category = {
  title: string;
  url?: string;
  allowedRoles: string[];
  children: PageEntry[];
};

function buildCategories(): Category[] {
  return toolsData.map((tool) => ({
    title: tool.title,
    url: tool.url,
    allowedRoles: tool.allowedRoles ?? [],
    children: (tool.subtools ?? [])
      .filter((s) => !!s.url)
      .map((s) => ({
        title: s.title,
        url: s.url!,
        allowedRoles: s.allowedRoles ?? [],
        parent: tool.title,
      })),
  }));
}

function flattenPages(): PageEntry[] {
  const pages: PageEntry[] = [];
  for (const tool of toolsData) {
    if (tool.url) {
      pages.push({
        title: tool.title,
        url: tool.url,
        allowedRoles: tool.allowedRoles ?? [],
      });
    }
    for (const sub of tool.subtools ?? []) {
      if (sub.url) {
        pages.push({
          title: sub.title,
          url: sub.url,
          allowedRoles: sub.allowedRoles ?? [],
          parent: tool.title,
        });
      }
    }
  }
  return pages;
}

const categories = buildCategories();
const allPages = flattenPages();

const iconComponents = {
  user: User,
  shield: Shield,
  shieldcheck: ShieldCheck,
  usercheck: UserCheck,
  code: Code,
  settings: Settings,
  megaphone: Megaphone,
  users: Users,
  filetext: FileText,
  cpu: Cpu,
};
function getRoleIcon(iconName?: string) {
  if (!iconName) return User;
  return (
    iconComponents[iconName.toLowerCase() as keyof typeof iconComponents] ??
    User
  );
}

const formSchema = z.object({
  allowedRoles: z.array(z.string()),
  maintenance: z.boolean(),
})

type PrivilegeForm = z.infer<typeof formSchema>;

function normalizeRoles(values: string[]): string[] {
  return [...new Set(values)].sort()
}

function hasSameRoles(left: string[], right: string[]): boolean {
  const normalizedLeft = normalizeRoles(left)
  const normalizedRight = normalizeRoles(right)

  if (normalizedLeft.length !== normalizedRight.length) return false

  return normalizedLeft.every((value, index) => value === normalizedRight[index])
}

export function UsersPrivilegesDialog({ open, onOpenChange }: Props) {
  const { privileges, maintenance, refresh } = usePagePrivileges()
  const { apiRoles } = useUsers()

  const [selected, setSelected] = useState<PageEntry | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);
  const [savingMatrix, setSavingMatrix] = useState(false);

  const isHome = selected?.url === "/home";
  const isUsers = selected?.url === "/users";
  const homeEntry = categories.find((c) => c.url === "/home");

  // Returns lowercase role values for a URL — DB wins, falls back to toolsData
  const getPrivilegesForUrl = useCallback(
    (url: string): string[] => {
      // Home is always open to all roles — never restrict it regardless of DB state
      if (isHomeUrl(url)) return apiRoles.map((r) => r.name.toLowerCase());
      const dbEntry = privileges[url];
      if (dbEntry !== undefined) {
        return dbEntry.length === 0
          ? apiRoles.map((r) => r.name.toLowerCase())
          : dbEntry;
      }
      const page = allPages.find((p) => p.url === url);
      const fallback = page?.allowedRoles ?? [];
      return fallback.length === 0
        ? apiRoles.map((r) => r.name.toLowerCase())
        : fallback;
    },
    [privileges, apiRoles]
  );

  const getMaintenanceForUrl = useCallback((url: string): boolean => {
    return maintenance[url] ?? false
  }, [maintenance])

  const buildMatrixValues = useCallback((): Record<string, string[]> => {
    return Object.fromEntries(allPages.map((page) => [page.url, getPrivilegesForUrl(page.url)]))
  }, [getPrivilegesForUrl])

  // Maps role display values (lowercase) to API role IDs
  const toRoleIds = useCallback(
    (values: string[]): number[] => {
      return values
        .map(
          (v) =>
            apiRoles.find((r) => r.name.toLowerCase() === v.toLowerCase())?.id
        )
        .filter((id): id is number => id !== undefined);
    },
    [apiRoles]
  );

  const form = useForm<PrivilegeForm>({
    resolver: zodResolver(formSchema),
    defaultValues: { allowedRoles: [], maintenance: false },
  })

  const matrixForm = useForm<{ pageRoles: Record<string, string[]> }>({
    defaultValues: { pageRoles: {} },
  });

  const isMatrixDirty = matrixForm.formState.isDirty;

  // Sync matrix form whenever DB privileges change
  useEffect(() => {
    matrixForm.reset({ pageRoles: buildMatrixValues() })
  }, [buildMatrixValues, matrixForm])

  // Sync By-Page form when selected page changes
  useEffect(() => {
    if (selected) {
      form.reset({
        allowedRoles: getPrivilegesForUrl(selected.url),
        maintenance: getMaintenanceForUrl(selected.url),
      })
    }
  }, [selected, getPrivilegesForUrl, getMaintenanceForUrl])

  // Select home on dialog open
  useEffect(() => {
    if (open && homeEntry) {
      setSelected({
        title: homeEntry.title,
        url: homeEntry.url!,
        allowedRoles: homeEntry.allowedRoles,
      });
    }
  }, [homeEntry, open]);

  const toggleExpand = (title: string) => {
    setExpanded((prev) => ({ ...prev, [title]: !prev[title] }));
  };

  const isHomeUrl = (url: string) => url === "/home";

  // Fix 2: remove the third argument — pagePrivilegesApi.update only accepts 2 args.
  // Pass maintenance separately if your API supports it, or extend the API call as needed.
  const onSubmit = async (data: PrivilegeForm) => {
    if (!selected) return;
    const toSave =
      apiRoles.length > 0 && data.allowedRoles.length === apiRoles.length
        ? []
        : data.allowedRoles;
    const roleIds = toRoleIds(toSave);
    try {
      setSaving(true)
      await pagePrivilegesApi.update(selected.url, roleIds, data.maintenance)
      form.reset({ allowedRoles: data.allowedRoles, maintenance: data.maintenance })
      await refresh({ silent: true })
      notifToast({ name: selected.title }, 'updateprivileges')
    } catch {
      notifToast(
        { reason: "Failed to update privileges. Please try again." },
        "error"
      );
    } finally {
      setSaving(false);
    }
  };

  const onMatrixSubmit = async (data: {
    pageRoles: Record<string, string[]>;
  }) => {
    try {
      setSavingMatrix(true)
      const changedPages = Object.entries(data.pageRoles).filter(([url, values]) => {
        return !hasSameRoles(values, getPrivilegesForUrl(url))
      })

      if (changedPages.length === 0) {
        matrixForm.reset({ pageRoles: buildMatrixValues() })
        return
      }

      await Promise.all(
        changedPages.map(([url, vals]) => {
          const toSave = apiRoles.length > 0 && vals.length === apiRoles.length ? [] : vals
          return pagePrivilegesApi.update(url, toRoleIds(toSave), getMaintenanceForUrl(url))
        })
      )
      matrixForm.reset(data)
      await refresh({ silent: true })
      notifToast({ name: 'Page Matrix' }, 'updateprivileges')
    } catch {
      notifToast(
        { reason: "Failed to update privileges. Please try again." },
        "error"
      );
    } finally {
      setSavingMatrix(false);
    }
  };

  const [activeTab, setActiveTab] = useState("pages");

  // Sync matrix → bypage when switching to pages tab
  // Sync bypage → matrix when switching to matrix tab
  const handleTabChange = (tab: string) => {
    if (tab === 'pages' && selected) {
      const matrixVal = matrixForm.getValues(`pageRoles.${selected.url}`)
      if (matrixVal) {
        form.reset({
          allowedRoles: matrixVal,
          maintenance: getMaintenanceForUrl(selected.url),
        })
      }
    }
    if (tab === "matrix") {
      if (selected && form.formState.isDirty) {
        matrixForm.setValue(
          `pageRoles.${selected.url}`,
          form.getValues("allowedRoles"),
          { shouldDirty: true }
        );
      }
    }
    setActiveTab(tab);
  };

  const isDirty = (form.formState.isDirty && !isHome) || isMatrixDirty;
  const isSaving = activeTab === "pages" ? saving : savingMatrix;
  const displayRoles = apiRoles.filter(
    (r) => r.name.toLowerCase() !== "superadmin"
  );

  const handleReset = () => {
    if (selected) {
      form.reset({
        allowedRoles: getPrivilegesForUrl(selected.url),
        maintenance: getMaintenanceForUrl(selected.url),
      })
      matrixForm.reset({ pageRoles: buildMatrixValues() })
    }
  };

  const handleSave = () => {
    if (activeTab === "pages") {
      form.handleSubmit(onSubmit)();
    } else {
      matrixForm.handleSubmit(onMatrixSubmit)();
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(s) => {
        onOpenChange(s);
        if (!s) {
          setSelected(null)
          setExpanded({})
          form.reset({ allowedRoles: [], maintenance: false })
          matrixForm.reset({ pageRoles: buildMatrixValues() })
        }
      }}
    >
      <DialogContent className="sm:max-w-5xl p-0 gap-0 overflow-hidden flex flex-col">
        <DialogHeader className="px-6 pt-6 pb-3 border-b">
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="size-4" />
            Page Privileges
          </DialogTitle>
          <DialogDescription>
            Manage which roles have access to each page.
          </DialogDescription>
        </DialogHeader>

        <Tabs
          value={activeTab}
          onValueChange={handleTabChange}
          className="flex flex-col min-h-0 flex-1"
        >
          {/* ── By Page tab ── */}
          <TabsContent
            value="pages"
            className="flex flex-1 overflow-hidden mt-0 max-h-[600px]"
          >
            <ScrollArea className="w-2/5 border-r">
              <div className="p-2 space-y-0.5">
                {categories.map((cat) => {
                  const isExpanded = expanded[cat.title];
                  const hasChildren = cat.children.length > 0;
                  const catEntry: PageEntry | null = cat.url
                    ? {
                      title: cat.title,
                      url: cat.url,
                      allowedRoles: cat.allowedRoles,
                    }
                    : null;

                  return (
                    <div key={cat.title}>
                      <button
                        type="button"
                        onClick={() => {
                          if (hasChildren) toggleExpand(cat.title);
                          if (catEntry) setSelected(catEntry);
                        }}
                        className={cn(
                          "w-full text-left px-3 py-2 rounded-md text-sm transition-colors flex items-center justify-between gap-2",
                          selected?.url === cat.url && cat.url
                            ? "bg-muted text-foreground"
                            : "hover:bg-muted/50 text-muted-foreground hover:text-foreground"
                        )}
                      >
                        <span className="font-medium">{cat.title}</span>
                        {hasChildren &&
                          (isExpanded ? (
                            <ChevronDown className="size-3.5 shrink-0" />
                          ) : (
                            <ChevronRight className="size-3.5 shrink-0" />
                          ))}
                      </button>

                      {hasChildren && isExpanded && (
                        <div className="ml-3 pl-2 border-l space-y-0.5 mt-0.5 mb-1">
                          {cat.children.map((child) => (
                            <button
                              key={child.url}
                              type="button"
                              onClick={() => setSelected(child)}
                              className={cn(
                                "w-full text-left px-3 py-2 rounded-md text-sm transition-colors flex flex-col",
                                selected?.url === child.url
                                  ? "bg-muted text-foreground"
                                  : "hover:bg-muted/50 text-muted-foreground hover:text-foreground"
                              )}
                            >
                              <span>{child.title}</span>
                              <span className="text-xs font-mono text-muted-foreground">
                                {child.url}
                              </span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </ScrollArea>

            <div className="flex-1 flex flex-col">
              {selected ? (
                <Form {...form}>
                  <form id="privileges-form" className="flex flex-col h-full">
                    <div className="p-6 flex-1 space-y-4 overflow-auto">
                      <div>
                        <p className="font-semibold text-sm">
                          {selected.title}
                        </p>
                        <p className="text-xs text-muted-foreground font-mono">
                          {selected.url}
                        </p>
                      </div>

                      {/* ── Maintenance toggle ── */}
                      <FormField
                        control={form.control}
                        name="maintenance"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                              Page Status
                            </FormLabel>
                            <FormControl>
                              <div
                                className={cn(
                                  "flex items-center gap-2.5 text-sm mt-1",
                                  isHome || isUsers ? "cursor-not-allowed" : "cursor-pointer"
                                )}
                                onClick={() => {
                                  if (isHome || isUsers) return;
                                  field.onChange(!field.value);
                                }}
                              >
                                <div
                                  className={cn(
                                    "size-4 rounded-sm border flex items-center justify-center shrink-0 transition-colors",
                                    field.value && !(isHome || isUsers)
                                      ? "bg-primary border-primary"
                                      : field.value && (isHome || isUsers)
                                        ? "bg-muted/40 border-muted-foreground/20"
                                        : "border-muted-foreground/30"
                                  )}
                                >
                                  {field.value && (
                                    <Check className="size-3 text-primary-foreground" />
                                  )}
                                </div>
                                <HardHat
                                  className={cn(
                                    "size-3.5",
                                    field.value && !(isHome || isUsers)
                                      ? "text-warning"
                                      : "text-muted-foreground/40"
                                  )}
                                />
                                <span
                                  className={cn(
                                    field.value && !(isHome || isUsers)
                                      ? "text-warning"
                                      : "text-muted-foreground/40"
                                  )}
                                >
                                  Under Maintenance
                                </span>
                              </div>
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="allowedRoles"
                        render={({ field }) => (
                          <FormItem className="space-y-3">
                            <FormLabel className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                              Allowed Roles
                            </FormLabel>
                            <FormControl>
                              <div className="space-y-2">
                                {displayRoles.map((role) => {
                                  const value = role.name.toLowerCase();
                                  const Icon = getRoleIcon(role.icon);
                                  const checked = field.value.includes(value);
                                  return (
                                    <div
                                      key={value}
                                      className={cn(
                                        "flex items-center gap-2.5 text-sm",
                                        isHome
                                          ? "cursor-not-allowed"
                                          : "cursor-pointer"
                                      )}
                                      onClick={() => {
                                        if (isHome) return;
                                        field.onChange(
                                          checked
                                            ? field.value.filter(
                                              (r) => r !== value
                                            )
                                            : [...field.value, value]
                                        );
                                      }}
                                    >
                                      <div
                                        className={cn(
                                          "size-4 rounded-sm border flex items-center justify-center shrink-0 transition-colors",
                                          checked && !isHome
                                            ? "bg-primary border-primary"
                                            : checked && isHome
                                              ? "bg-primary/40 border-primary/40"
                                              : "border-muted-foreground/30"
                                        )}
                                      >
                                        {checked && (
                                          <Check className="size-3 text-primary-foreground" />
                                        )}
                                      </div>
                                      <Icon
                                        className={cn(
                                          "size-3.5",
                                          checked && !isHome
                                            ? "text-foreground"
                                            : "text-muted-foreground/40"
                                        )}
                                      />
                                      <span
                                        className={cn(
                                          "capitalize",
                                          checked && !isHome
                                            ? "text-foreground"
                                            : "text-muted-foreground/40"
                                        )}
                                      >
                                        {role.name}
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                  </form>
                </Form>
              ) : (
                <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
                  Select a page to view its privileges
                </div>
              )}
            </div>
          </TabsContent>

          {/* ── Matrix tab ── */}
          <TabsContent
            value="matrix"
            className="overflow-hidden mt-0 flex flex-col max-h-[600px]"
          >
            <ScrollArea className="flex-1 overflow-auto">
              <Form {...matrixForm}>
                <form
                  id="matrix-form"
                  onSubmit={matrixForm.handleSubmit(onMatrixSubmit)}
                  className="flex flex-col h-full overflow-hidden"
                >
                  <div className="overflow-auto flex-1 p-4">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-background">
                          <TableHead className="sticky top-0 bg-background z-10 text-xs font-medium uppercase tracking-wide min-w-[160px]">
                            Page
                          </TableHead>
                          {displayRoles.map((role) => {
                            const Icon = getRoleIcon(role.icon);
                            return (
                              <TableHead
                                key={role.name.toLowerCase()}
                                className="sticky top-0 bg-background z-10 text-center p-2 max-w-[80px]"
                              >
                                <div className="flex flex-col items-center gap-1">
                                  <Icon className="size-3.5 text-muted-foreground" />
                                  <span className="text-xs font-medium text-muted-foreground capitalize truncate w-full text-center">
                                    {role.name}
                                  </span>
                                </div>
                              </TableHead>
                            );
                          })}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {allPages.map((page) => (
                          <FormField
                            key={page.url}
                            control={matrixForm.control}
                            name={`pageRoles.${page.url}`}
                            render={({ field }) => (
                              <TableRow>
                                <TableCell className="py-2.5 pr-4">
                                  <div className="flex flex-col">
                                    {page.parent && (
                                      <span className="text-xs text-muted-foreground">
                                        {page.parent}
                                      </span>
                                    )}
                                    <span
                                      className={cn(
                                        "font-medium",
                                        page.parent ? "text-xs" : "text-sm"
                                      )}
                                    >
                                      {page.title}
                                    </span>
                                  </div>
                                </TableCell>
                                {displayRoles.map((role) => {
                                  const value = role.name.toLowerCase();
                                  const checked = (field.value ?? []).includes(
                                    value
                                  );
                                  const locked = isHomeUrl(page.url);
                                  return (
                                    <TableCell
                                      key={value}
                                      className="py-2.5 px-2 text-center"
                                    >
                                      <div
                                        className={cn(
                                          "size-4 flex items-center justify-center mx-auto transition-colors",
                                          locked
                                            ? "cursor-not-allowed"
                                            : "cursor-pointer"
                                        )}
                                        onClick={() => {
                                          if (locked) return;
                                          const current = field.value ?? [];
                                          field.onChange(
                                            current.includes(value)
                                              ? current.filter(
                                                (r) => r !== value
                                              )
                                              : [...current, value]
                                          );
                                        }}
                                      >
                                        {checked ? (
                                          <Check
                                            className={cn(
                                              "size-3.5",
                                              locked
                                                ? "text-success/40"
                                                : "text-success"
                                            )}
                                          />
                                        ) : (
                                          <Minus className="size-3.5 text-muted-foreground/20 hover:text-muted-foreground/50" />
                                        )}
                                      </div>
                                    </TableCell>
                                  );
                                })}
                              </TableRow>
                            )}
                          />
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </form>
              </Form>
            </ScrollArea>
          </TabsContent>
        </Tabs>
        <div className="flex items-center justify-between px-4 pb-4 pt-3 border-t">
          <div className="flex gap-1">
            <Button
              type="button"
              variant={activeTab === "pages" ? "secondary" : "ghost"}
              size="icon"
              className="h-7 w-7"
              onClick={() => handleTabChange("pages")}
              disabled={isDirty}
            >
              <List className="size-3.5" />
            </Button>
            <Button
              type="button"
              variant={activeTab === "matrix" ? "secondary" : "ghost"}
              size="icon"
              className="h-7 w-7"
              onClick={() => handleTabChange("matrix")}
              disabled={isDirty}
            >
              <LayoutGrid className="size-3.5" />
            </Button>
          </div>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleReset}
              disabled={isSaving || !isDirty}
            >
              Reset
            </Button>
            <Button
              type="button"
              onClick={handleSave}
              disabled={isSaving || !isDirty}
            >
              {isSaving ? "Saving…" : "Save"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
