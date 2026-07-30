import re
with open("app/(dashboard)/dashboard/page.tsx", "r") as f:
    content = f.read()

content = content.replace('Sparkles, FolderOpen, FileText, Warehouse', 'Sparkles, FolderOpen, FileText, Warehouse, Users')
content = content.replace('lg:grid-cols-3 gap-8 w-full max-w-5xl', 'lg:grid-cols-4 gap-8 w-full max-w-6xl')

clients_box = """
          {/* Clients */}
          <Link
            href="/clients"
            className="group flex flex-col items-center gap-6 rounded-2xl border border-slate-200 bg-white px-10 py-16 text-center transition-all duration-300 hover:border-slate-300 hover:shadow-md active:scale-[0.98]"
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-slate-100 bg-slate-50 text-slate-700 transition group-hover:bg-slate-100">
              <Users className="h-7 w-7 text-slate-500" />
            </div>
            <div>
              <p className="text-base font-bold text-slate-800 transition group-hover:text-slate-950">Clients</p>
              <p className="text-xs text-slate-400 mt-1.5 font-medium leading-relaxed max-w-[200px]">
                Manage customers for quick access
              </p>
            </div>
          </Link>
"""

content = content.replace('        </div>\n      </div>', clients_box + '        </div>\n      </div>')

with open("app/(dashboard)/dashboard/page.tsx", "w") as f:
    f.write(content)
print("Updated dashboard.tsx")
