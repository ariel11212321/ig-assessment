import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Pipe({ name: 'caption', standalone: true })
export class CaptionPipe implements PipeTransform {
  constructor(private sanitizer: DomSanitizer) {}

  transform(text: string | null): SafeHtml {
    if (!text) return '';
    let html = this.escapeHtml(text);
    // Convert hashtags to links
    html = html.replace(/#(\w+)/g, '<a class="caption-link" data-hashtag="$1">#$1</a>');
    // Convert mentions to links
    html = html.replace(/@(\w+)/g, '<a class="caption-link" data-mention="$1">@$1</a>');
    // Convert URLs to links
    html = html.replace(/(https?:\/\/[^\s]+)/g, '<a class="caption-link" href="$1" target="_blank" rel="noopener">$1</a>');
    // Line breaks
    html = html.replace(/\n/g, '<br>');
    return this.sanitizer.bypassSecurityTrustHtml(html);
  }

  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}
