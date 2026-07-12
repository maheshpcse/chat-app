import { Component, Output, EventEmitter } from '@angular/core';

/**
 * EmojiPickerComponent - Custom emoji picker built for Angular 10 compatibility.
 * No third-party packages needed. Uses unicode emojis organized by category.
 */
@Component({
  selector: 'app-emoji-picker',
  templateUrl: './emoji-picker.component.html',
  styleUrls: ['./emoji-picker.component.scss']
})
export class EmojiPickerComponent {

  @Output() emojiSelected = new EventEmitter<string>();
  @Output() closePicker = new EventEmitter<void>();

  activeCategory: string = 'smileys';
  searchTerm: string = '';
  recentEmojis: string[] = [];

  categories = [
    { id: 'recent', icon: '🕐', label: 'Recent' },
    { id: 'smileys', icon: '😀', label: 'Smileys' },
    { id: 'people', icon: '👋', label: 'People' },
    { id: 'animals', icon: '🐶', label: 'Animals' },
    { id: 'food', icon: '🍕', label: 'Food' },
    { id: 'travel', icon: '✈️', label: 'Travel' },
    { id: 'activities', icon: '⚽', label: 'Activities' },
    { id: 'objects', icon: '💡', label: 'Objects' },
    { id: 'symbols', icon: '❤️', label: 'Symbols' }
  ];

  emojiData: { [key: string]: string[] } = {
    smileys: [
      '😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃',
      '😉', '😊', '😇', '🥰', '😍', '🤩', '😘', '😗', '😚', '😙',
      '🥲', '😋', '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫',
      '🤔', '🤐', '🤨', '😐', '😑', '😶', '😏', '😒', '🙄', '😬',
      '😮', '🤯', '😲', '🥳', '🤠', '🤡', '😈', '👿', '👻', '💀',
      '☠️', '👽', '👾', '🤖', '💩', '😺', '😸', '😹', '😻', '😼'
    ],
    people: [
      '👋', '🤚', '🖐️', '✋', '🖖', '👌', '🤌', '🤏', '✌️', '🤞',
      '🤟', '🤘', '🤙', '👈', '👉', '👆', '🖕', '👇', '☝️', '👍',
      '👎', '✊', '👊', '🤛', '🤜', '👏', '🙌', '👐', '🤲', '🤝',
      '🙏', '✍️', '💪', '🦾', '🦿', '🦵', '🦶', '👂', '🦻', '👃',
      '👶', '👧', '🧒', '👦', '👩', '🧑', '👨', '👩‍🦱', '🧑‍🦱', '👨‍🦱'
    ],
    animals: [
      '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐻‍❄️', '🐨',
      '🐯', '🦁', '🐮', '🐷', '🐽', '🐸', '🐵', '🙈', '🙉', '🙊',
      '🐒', '🐔', '🐧', '🐦', '🐤', '🐣', '🐥', '🦆', '🦅', '🦉',
      '🦇', '🐺', '🐗', '🐴', '🦄', '🐝', '🪱', '🐛', '🦋', '🐌'
    ],
    food: [
      '🍕', '🍔', '🍟', '🌭', '🥪', '🌮', '🌯', '🥙', '🧆', '🥚',
      '🍳', '🥘', '🍲', '🥣', '🥗', '🍿', '🧈', '🧂', '🥫', '🍝',
      '🍜', '🍛', '🍣', '🍱', '🥟', '🦪', '🍤', '🍙', '🍚', '🍘',
      '🍥', '🥠', '🥮', '🍢', '🍡', '🍧', '🍨', '🍦', '🥧', '🧁'
    ],
    travel: [
      '✈️', '🚗', '🚕', '🚙', '🚌', '🚎', '🏎️', '🚓', '🚑', '🚒',
      '🚐', '🛻', '🚚', '🚛', '🚜', '🛵', '🏍️', '🛺', '🚲', '🛴',
      '🚂', '🚃', '🚄', '🚅', '🚆', '🚇', '🚈', '🚉', '🚊', '🚁',
      '🏠', '🏡', '🏢', '🏣', '🏤', '🏥', '🏦', '🏨', '🏩', '🏪'
    ],
    activities: [
      '⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉', '🥏', '🎱',
      '🪀', '🏓', '🏸', '🏒', '🏑', '🥍', '🏏', '🪃', '🥅', '⛳',
      '🎯', '🏹', '🎣', '🤿', '🥊', '🥋', '🎽', '🛹', '🛼', '🛷',
      '🎮', '🕹️', '🎲', '🧩', '🎭', '🎨', '🎪', '🎤', '🎧', '🎼'
    ],
    objects: [
      '💡', '🔦', '🕯️', '📱', '💻', '⌨️', '🖥️', '🖨️', '🖱️', '💾',
      '💿', '📀', '🎥', '📸', '📹', '📺', '📻', '🎙️', '⏰', '⌚',
      '📡', '🔋', '🔌', '💰', '💳', '💎', '🔑', '🗝️', '🔒', '🔓',
      '📦', '📫', '📪', '📬', '📭', '📮', '🗳️', '✏️', '📝', '📁'
    ],
    symbols: [
      '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔',
      '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '☮️',
      '✝️', '☪️', '🕉️', '☸️', '✡️', '🔯', '🕎', '☯️', '☦️', '🛐',
      '⛎', '♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐',
      '✅', '❌', '❓', '❗', '‼️', '⭐', '🌟', '💫', '✨', '🔥'
    ]
  };

  constructor() {
    this.loadRecent();
  }

  selectCategory(categoryId: string): void {
    this.activeCategory = categoryId;
    this.searchTerm = '';
  }

  selectEmoji(emoji: string): void {
    this.emojiSelected.emit(emoji);
    this.addToRecent(emoji);
  }

  getDisplayEmojis(): string[] {
    if (this.searchTerm.trim()) {
      // Search across all categories
      const all: string[] = [];
      Object.values(this.emojiData).forEach(emojis => all.push(...emojis));
      return all; // Unicode search not practical, return all
    }

    if (this.activeCategory === 'recent') {
      return this.recentEmojis;
    }

    return this.emojiData[this.activeCategory] || [];
  }

  private addToRecent(emoji: string): void {
    this.recentEmojis = [emoji, ...this.recentEmojis.filter(e => e !== emoji)].slice(0, 30);
    try {
      localStorage.setItem('chat_recent_emojis', JSON.stringify(this.recentEmojis));
    } catch (e) {}
  }

  private loadRecent(): void {
    try {
      const stored = localStorage.getItem('chat_recent_emojis');
      if (stored) {
        this.recentEmojis = JSON.parse(stored);
      }
    } catch (e) {
      this.recentEmojis = [];
    }
  }

  close(): void {
    this.closePicker.emit();
  }
}
