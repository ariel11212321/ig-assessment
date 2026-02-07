import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-verified-badge',
  standalone: true,
  template: `
    <svg [attr.width]="size" [attr.height]="size" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
      <path d="M19.998 3.094L14.638 0l-2.972 5.15H5.432v6.354L0 14.64 3.094 20 0 25.359l5.432 3.137v6.354h6.234L14.638 40l5.36-3.094L25.358 40l2.972-5.15h6.234v-6.354L40 25.359 36.905 20 40 14.641l-5.436-3.137V5.15h-6.234L25.358 0l-5.36 3.094z" fill="#3897f0"/>
      <path d="M17.204 27.58l-6.87-6.87 3.645-3.644 3.225 3.227 7.617-7.618 3.646 3.646-11.263 11.26z" fill="#fff"/>
    </svg>
  `,
  styles: [`:host { display: inline-flex; align-items: center; vertical-align: middle; margin-left: 4px; }`]
})
export class VerifiedBadgeComponent {
  @Input() size = '18';
}
