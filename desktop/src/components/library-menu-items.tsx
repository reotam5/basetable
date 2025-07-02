
import { useMatches, useNavigate } from "@tanstack/react-router";
import * as React from "react";
import { SidebarMenuButton, SidebarMenuItem } from "./ui/sidebar";

export function LibraryMenuItems() {
  const navigate = useNavigate();
  const matches = useMatches<any>();
  const importedLibraries = [
    {
      id: 1,
      title: "Library 1",
    }
  ];

  return (
    <React.Fragment key={"library-menu-items"}>
      {importedLibraries.length > 0 && (
        <div key={"library-divider"} className="ml-2 text-xs text-muted-foreground mt-2">
          Downloaded
        </div>
      )}
      {importedLibraries.map((item) => (
        <SidebarMenuItem key={"library" + item.id}>
          <SidebarMenuButton
            isActive={matches?.[matches.length - 1]?.params?.lib_id == item.id}
            onClick={() => navigate({ to: `/library/search/${item.id}` })}
          >
            <span className="truncate">
              {item.title}
            </span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      ))}
    </React.Fragment>
  )
}
