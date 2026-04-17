const WA_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '9515033232';

export function buildWhatsAppLink(type, formData, machineInfo) {
  const machineLine = machineInfo
    ? `📍 Machine: ${machineInfo.machine_code} — ${machineInfo.location}`
    : '';

  let lines = [
    `*SnackMaster — ${typeLabel(type)}*`,
    machineLine,
    `📅 ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`,
    '',
  ];

  for (const [key, value] of Object.entries(formData)) {
    if (value !== undefined && value !== null && value !== '') {
      const label = key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
      lines.push(`*${label}:* ${value}`);
    }
  }

  if (type === 'refund') {
    lines.push('');
    lines.push('_(Please attach payment screenshot)_');
  }

  const text = encodeURIComponent(lines.join('\n'));
  return `https://wa.me/${WA_NUMBER}?text=${text}`;
}

function typeLabel(type) {
  const labels = {
    complaint: 'Complaint',
    refund: 'Refund Request',
    feedback: 'Weekly Feedback',
    suggestion: 'Product Suggestion',
    rating: 'Service Rating',
  };
  return labels[type] || type;
}
