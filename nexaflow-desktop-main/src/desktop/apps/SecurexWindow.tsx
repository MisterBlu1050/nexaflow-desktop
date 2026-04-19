import Window from "../Window";
import { useDesktop } from "../store";

export default function SecurexWindow() {
  return (
    <Window id="securex" noPadding>
      <div className="h-full bg-white text-[hsl(220_15%_18%)] flex flex-col">
        <header className="h-14 bg-[hsl(210_60%_25%)] text-white flex items-center px-5">
          <div className="font-bold tracking-wide">Payroll</div>
          <div className="ml-3 text-[12px] opacity-80">Payroll Portal · Belgium</div>
          <div className="ml-auto text-[12px] opacity-80">CHRO Persona</div>
        </header>
        <div className="p-6 flex-1 overflow-y-auto scrollbar-light">
          <h1 className="text-xl font-semibold mb-4">April 2026 Payroll — Demo Company (BE)</h1>

          <div className="grid grid-cols-4 gap-3 mb-6">
            {[
              {label: "Employees processed", val: "250 / 250", color: "text-status-green"},
              {label: "Status", val: "✅ Validated", color: "text-status-green"},
              {label: "Payment date", val: "April 25, 2026"},
              {label: "Total gross payroll", val: "€1,847,320"},
            ].map((s,i) => (
              <div key={i} className="border rounded-lg p-4 bg-[hsl(220_14%_98%)]">
                <div className="text-[11px] uppercase tracking-wide text-[hsl(220_9%_46%)]">{s.label}</div>
                <div className={`text-lg font-semibold mt-1 ${s.color ?? ""}`}>{s.val}</div>
              </div>
            ))}
          </div>

          <div className="border rounded-lg overflow-hidden">
            <div className="px-4 py-3 bg-[hsl(210_60%_25%)] text-white text-[12px] font-semibold">Breakdown</div>
            <table className="w-full text-[13px]">
              <thead className="bg-[hsl(220_14%_96%)] text-[hsl(220_9%_46%)]">
                <tr><th className="text-left p-3">Category</th><th className="text-right p-3">Headcount</th><th className="text-right p-3">Gross (€)</th></tr>
              </thead>
              <tbody>
                {[
                  ["Engineering", 95, 812450],
                  ["Sales & Marketing", 62, 458320],
                  ["Operations", 48, 312540],
                  ["G&A (incl. HR/Finance)", 35, 204210],
                  ["Executive", 10, 59800],
                ].map((r,i) => (
                  <tr key={i} className="border-t">
                    <td className="p-3">{r[0]}</td>
                    <td className="p-3 text-right">{r[1]}</td>
                    <td className="p-3 text-right">€{(r[2] as number).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="text-[11px] text-[hsl(220_9%_46%)] mt-4">Legal references: CP 200 (Auxiliary Joint Committee, Belgium) · payroll fiches archived 5 years per Belgian Social Security regulations.</p>
        </div>
      </div>
    </Window>
  );
}
