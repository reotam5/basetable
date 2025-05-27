import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { DialogProps } from "@radix-ui/react-dialog";
import { useNavigate } from "@tanstack/react-router";
import { Command as CommandPrimitive } from "cmdk";
import {
    CreditCard,
    Network,
    Search, Settings
} from "lucide-react";
import * as React from "react";

export function CommandMenu({ ...props }: DialogProps) {
    const navigate = useNavigate();
    const [open, setOpen] = React.useState(false);

    React.useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setOpen((open) => !open);
            }
        };

        document.addEventListener("keydown", down);
        return () => document.removeEventListener("keydown", down);
    }, []);

    const runCommand = React.useCallback((command: () => unknown) => {
        setOpen(false);
        command();
    }, []);

    return (
        <>
            <Button
                variant="outline"
                className="relative h-9 w-9 p-0 xl:h-9 xl:w-60 xl:justify-start xl:px-3 xl:py-2"
                onClick={() => setOpen(true)}
                {...props}
            >
                <Search className="h-4 w-4 xl:mr-2" aria-hidden="true" />
                <span className="hidden xl:inline-flex">Search</span>
                <span className="sr-only">Search</span>
                <kbd className="pointer-events-none absolute right-1.5 top-2 hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 xl:flex">
                    <span className="text-xs">⌘</span>K
                </kbd>
            </Button>
            <CommandDialog open={open} onOpenChange={setOpen}>
                <CommandInput placeholder="Type a command or search..." />
                <CommandList>
                    <CommandEmpty>No results found.</CommandEmpty>
                    <CommandGroup heading="Suggestions">
                        <CommandItem
                            onSelect={() =>
                                runCommand(() => navigate({ to: "/dashboard", params: { tenantId: "arx" } }))
                            }
                        >
                            <Network className="mr-2 h-4 w-4" />
                            <span>Go to Dashboard</span>
                        </CommandItem>
                    </CommandGroup>
                    <CommandGroup heading="Settings">
                        <CommandItem
                            onSelect={() =>
                                runCommand(() => navigate({ to: "/settings" }))
                            }
                        >
                            <Settings className="mr-2 h-4 w-4" />
                            <span>Settings</span>
                        </CommandItem>
                        <CommandItem
                            onSelect={() =>
                                runCommand(() => navigate({ to: "/settings/billing" }))
                            }
                        >
                            <CreditCard className="mr-2 h-4 w-4" />
                            <span>Billing</span>
                        </CommandItem>
                    </CommandGroup>
                </CommandList>
            </CommandDialog>
        </>
    );
}

function CommandDialog({
    children,
    ...props
}: React.ComponentPropsWithoutRef<typeof Dialog>) {
    return (
        <Dialog {...props}>
            <DialogContent className="overflow-hidden p-0 shadow-lg">
                <Command className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group]:not([hidden])_~[cmdk-group]]:pt-0 [&_[cmdk-group]]:px-2 [&_[cmdk-input-wrapper]_svg]:h-5 [&_[cmdk-input-wrapper]_svg]:w-5 [&_[cmdk-input]]:h-12 [&_[cmdk-item]]:px-2 [&_[cmdk-item]]:py-3 [&_[cmdk-item]_svg]:h-5 [&_[cmdk-item]_svg]:w-5">
                    {children}
                </Command>
            </DialogContent>
        </Dialog>
    );
}

function Command({
    className,
    ...props
}: React.ComponentPropsWithoutRef<typeof CommandPrimitive>) {
    return (
        <CommandPrimitive
            className={cn(
                "flex h-full w-full flex-col overflow-hidden rounded-md bg-popover text-popover-foreground",
                className,
            )}
            {...props}
        />
    );
}

function CommandInput({
    className,
    ...props
}: React.ComponentPropsWithoutRef<typeof CommandPrimitive.Input>) {
    return (
        <div className="flex items-center border-b px-3" cmdk-input-wrapper="">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <CommandPrimitive.Input
                className={cn(
                    "flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50",
                    className,
                )}
                {...props}
            />
        </div>
    );
}

function CommandList({
    className,
    ...props
}: React.ComponentPropsWithoutRef<typeof CommandPrimitive.List>) {
    return (
        <CommandPrimitive.List
            className={cn(
                "max-h-[300px] overflow-y-auto overflow-x-hidden",
                className,
            )}
            {...props}
        />
    );
}

function CommandEmpty({
    className,
    ...props
}: React.ComponentPropsWithoutRef<typeof CommandPrimitive.Empty>) {
    return (
        <CommandPrimitive.Empty
            className={cn("py-6 text-center text-sm", className)}
            {...props}
        />
    );
}

function CommandGroup({
    className,
    ...props
}: React.ComponentPropsWithoutRef<typeof CommandPrimitive.Group>) {
    return (
        <CommandPrimitive.Group
            className={cn(
                "overflow-hidden p-1 text-foreground [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground",
                className,
            )}
            {...props}
        />
    );
}

function CommandItem({
    className,
    ...props
}: React.ComponentPropsWithoutRef<typeof CommandPrimitive.Item>) {
    return (
        <CommandPrimitive.Item
            className={cn(
                "relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none aria-selected:bg-accent aria-selected:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
                className,
            )}
            {...props}
        />
    );
}