import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { getModuleForPath, hasModuleAccess } from '@/lib/routeModules';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShieldOff } from 'lucide-react';
import { Link } from 'react-router-dom';

interface ModuleRouteProps {
  children: ReactNode;
  module?: string;
}

export function ModuleRoute({ children, module }: ModuleRouteProps) {
  const { user } = useAuth();
  const location = useLocation();
  const moduleKey = module || getModuleForPath(location.pathname);

  if (!moduleKey) {
    return <>{children}</>;
  }

  if (!hasModuleAccess(user?.moduleAccess, moduleKey)) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center space-y-4">
            <ShieldOff className="h-12 w-12 text-muted-foreground mx-auto" />
            <div>
              <h2 className="text-xl font-semibold">Access restricted</h2>
              <p className="text-sm text-muted-foreground mt-2">
                Your role does not include access to this module.
              </p>
            </div>
            <Button asChild>
              <Link to="/">Back to dashboard</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}

export default ModuleRoute;
