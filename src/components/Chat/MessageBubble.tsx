import React from 'react';
import type { Message } from '../../types';
import { formatDistanceToNow } from 'date-fns';

interface Props {
  message: Message;
  isOwn: boolean;
}

export default function MessageBubble({ message, isOwn }: Props) {
  const time = formatDistanceToNow(new Date(message.timestamp), { addSuffix: true });

  if (message.is_system) {
    return (
      <div className="flex justify-center my-2">
        <span className="text-xs text-slate-500 bg-white/5 px-3 py-1 rounded-full">
          {message.content}
        </span>
      </div>
    );
  }

  return (
    <div className={`flex flex-col gap-1 animate-slide-up ${isOwn ? 'items-end' : 'items-start'}`}>
      <div className={`flex items-end gap-2 max-w-[75%] ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
        {/* Avatar */}
        <div className={`w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold
          ${isOwn ? 'bg-brand-600 text-white' : 'bg-slate-700 text-slate-300'}`}>
          {message.user_name[0].toUpperCase()}
        </div>

        {/* Bubble */}
        <div className={`rounded-2xl px-4 py-2.5 max-w-full ${
          isOwn
            ? 'bg-gradient-to-br from-brand-500 to-brand-700 text-white rounded-br-none shadow-lg shadow-brand-900/30'
            : 'glass text-slate-100 rounded-bl-none'
        }`}>
          {!isOwn && (
            <p className="text-xs font-semibold text-brand-300 mb-0.5">{message.user_name}</p>
          )}
          <p className="text-sm leading-relaxed break-words">{message.content}</p>
        </div>
      </div>
      <span className="text-xs text-slate-600 px-9">{time}</span>
    </div>
  );
}
