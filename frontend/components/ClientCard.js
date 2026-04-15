import Link from 'next/link'

export default function ClientCard({ client }) {
  const colors   = Array.isArray(client.brand_colors) ? client.brand_colors : []
  const primary  = colors[0] || '#6366F1'
  const services = Array.isArray(client.services) ? client.services : []

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 hover:shadow-md transition-all duration-200 flex flex-col">

      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center text-white font-bold text-lg flex-shrink-0"
          style={{ backgroundColor: primary }}
        >
          {client.name.charAt(0).toUpperCase()}
        </div>
        <div className="flex items-center gap-1 flex-wrap justify-end max-w-[60%]">
          {colors.slice(0, 5).map((c, i) => (
            <div key={i} className="w-3 h-3 rounded-full border border-slate-200 flex-shrink-0"
              style={{ backgroundColor: c }} />
          ))}
          {colors.length > 5 && (
            <span className="text-xs text-slate-400">+{colors.length - 5}</span>
          )}
          <span className="text-xs text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full ml-1 capitalize">
            {client.tone_of_voice}
          </span>
        </div>
      </div>

      {/* Info */}
      <h3 className="font-semibold text-slate-900 mb-0.5">{client.name}</h3>
      <p className="text-sm text-slate-500 mb-3 capitalize">{client.industry}</p>

      {client.location && (
        <p className="text-xs text-slate-400 mb-3">📍 {client.location}</p>
      )}

      {services.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-4">
          {services.slice(0, 3).map((s, i) => (
            <span key={i} className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full capitalize">
              {s}
            </span>
          ))}
          {services.length > 3 && (
            <span className="text-xs text-slate-400 px-1">+{services.length - 3}</span>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 mt-auto pt-4 border-t border-slate-50">
        <Link href={`/generate?client=${client.id}`}
          className="flex-1 text-center text-xs font-medium bg-indigo-600 text-white py-2 px-3 rounded-lg hover:bg-indigo-700 transition-colors">
          Generate
        </Link>
        <Link href={`/posts?client=${client.id}`}
          className="flex-1 text-center text-xs font-medium bg-slate-100 text-slate-700 py-2 px-3 rounded-lg hover:bg-slate-200 transition-colors">
          View Posts
        </Link>
      </div>
    </div>
  )
}
