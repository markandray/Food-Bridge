import { Utensils, Users, CheckCircle } from 'lucide-react';
import { ROLES } from '../../utils/constants';

const RoleCard = ({ role, selected, onSelect }) => {
  const config = {
    [ROLES.RESTAURANT]: {
      icon:        Utensils,
      title:       'Restaurant',
      description: 'I have surplus food to donate',
      color: selected
        ? 'border-orange-400 bg-orange-50 ring-2 ring-orange-300'
        : 'border-slate-200 hover:border-orange-300 hover:bg-orange-50/50',
      iconBg:    'bg-orange-100',
      iconColor: 'text-orange-600',
    },
    [ROLES.NGO]: {
      icon:        Users,
      title:       'NGO',
      description: 'I collect and distribute food',
      color: selected
        ? 'border-blue-400 bg-blue-50 ring-2 ring-blue-300'
        : 'border-slate-200 hover:border-blue-300 hover:bg-blue-50/50',
      iconBg:    'bg-blue-100',
      iconColor: 'text-blue-600',
    },
  };

  const { icon: Icon, title, description, color, iconBg, iconColor } = config[role];

  return (
    <button
      type="button"
      onClick={() => onSelect(role)}
      className={`relative flex flex-col items-center gap-3 p-5 rounded-xl border-2 transition-all cursor-pointer text-center w-full ${color}`}
    >
      {selected && (
        <div className="absolute top-2 right-2">
          <CheckCircle className="h-5 w-5 text-emerald-500" />
        </div>
      )}
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${iconBg}`}>
        <Icon className={`h-6 w-6 ${iconColor}`} />
      </div>
      <div>
        <p className="font-semibold text-slate-800">{title}</p>
        <p className="text-xs text-slate-500 mt-0.5">{description}</p>
      </div>
    </button>
  );
};

export default RoleCard;