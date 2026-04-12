import { Route, Switch } from "wouter";
import { Toaster } from "sonner";
import Dashboard from "./Dashboard";
import Home from "./Home";

export default function App() {
  return (
    <>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/dashboard" component={Dashboard} />
        <Route>
          <div className="flex items-center justify-center h-screen text-[#8892a4]">
            Page not found
          </div>
        </Route>
      </Switch>
      <Toaster
        position="top-right"
        gap={8}
        toastOptions={{
          duration: 4000,
          style: {
            background: "rgba(8, 14, 28, 0.96)",
            backdropFilter: "blur(24px)",
            WebkitBackdropFilter: "blur(24px)",
            border: "1px solid rgba(0, 212, 255, 0.15)",
            borderRadius: "10px",
            color: "#cbd5e1",
            fontFamily: "'IBM Plex Mono', 'DM Sans', monospace",
            fontSize: "12.5px",
            letterSpacing: "0.01em",
            boxShadow:
              "0 8px 40px rgba(0,0,0,0.65), 0 0 0 1px rgba(0,212,255,0.05), 0 0 24px rgba(0,212,255,0.04)",
            padding: "12px 16px",
            maxWidth: "380px",
          },
          classNames: {
            toast: "!items-start",
            title: "!text-white !font-semibold !text-[13px]",
            description: "!text-[#8892a4] !text-[12px]",
            success:
              "!border-[rgba(6,214,160,0.3)] !shadow-[0_0_24px_rgba(6,214,160,0.08)]",
            error:
              "!border-[rgba(255,59,59,0.35)] !shadow-[0_0_24px_rgba(255,59,59,0.1)]",
            warning:
              "!border-[rgba(255,209,102,0.3)] !shadow-[0_0_24px_rgba(255,209,102,0.08)]",
            info: "!border-[rgba(0,212,255,0.25)] !shadow-[0_0_24px_rgba(0,212,255,0.08)]",
            actionButton:
              "!bg-[rgba(0,212,255,0.12)] !text-[#00d4ff] !border !border-[rgba(0,212,255,0.25)] !rounded-md !text-[11px] !font-mono hover:!bg-[rgba(0,212,255,0.2)]",
            cancelButton:
              "!bg-[rgba(255,255,255,0.05)] !text-[#8892a4] !border !border-[rgba(255,255,255,0.08)] !rounded-md !text-[11px] !font-mono hover:!bg-[rgba(255,255,255,0.08)]",
            closeButton:
              "!text-[#8892a4] hover:!text-white !bg-[rgba(255,255,255,0.05)] hover:!bg-[rgba(255,255,255,0.1)] !border-[rgba(255,255,255,0.08)]",
          },
        }}
      />
    </>
  );
}
