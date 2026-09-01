import { Link } from "react-router-dom";
import { ChevronRight, Settings, Shield, UserCog } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { APP_ROUTES, SETTINGS_HUB_ITEMS } from "@/lib/appRoutes";

const hubIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  [APP_ROUTES.settings.profile]: UserCog,
  [APP_ROUTES.settings.roles]: Shield,
};

export function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Settings className="h-6 w-6 text-primary" />
          Settings & configuration
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          System administration, your profile, and access control templates.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {SETTINGS_HUB_ITEMS.map((item) => {
          const Icon = hubIcons[item.path] ?? Settings;
          return (
            <Link key={item.path} to={item.path}>
              <Card className="h-full transition-colors hover:border-primary/40 hover:bg-muted/30">
                <CardContent className="p-5 flex items-start justify-between gap-3">
                  <div className="flex gap-3">
                    <div className="h-11 w-11 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold text-lg">{item.hubTitle}</p>
                      <p className="text-sm text-muted-foreground mt-1">{item.hubDescription}</p>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground mt-1 shrink-0" />
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export default SettingsPage;
