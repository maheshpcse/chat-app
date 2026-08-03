import { Component } from '@angular/core';
import { Router } from '@angular/router';

interface IFakerHubCard {
  title: string;
  description: string;
  icon: string;
  route: string;
}

@Component({
  selector: 'app-admin-faker-hub',
  templateUrl: './admin-faker-hub.component.html',
  styleUrls: ['./admin-faker-hub.component.scss']
})
export class AdminFakerHubComponent {
  cards: IFakerHubCard[] = [
    {
      title: 'Users',
      description: 'Generate preview chat users, edit fields, then save with bcrypt passwords.',
      icon: 'person_add',
      route: '/admin/faker/users'
    },
    {
      title: 'Contacts',
      description: 'Create accepted friendships or pending contact requests between existing users.',
      icon: 'contacts',
      route: '/admin/faker/contacts'
    },
    {
      title: 'Groups',
      description: 'Build sample chat groups with members and roles from active users.',
      icon: 'groups',
      route: '/admin/faker/groups'
    },
    {
      title: 'Messages',
      description: 'Seed private/group-style preview messages using existing conversations or pairs.',
      icon: 'chat',
      route: '/admin/faker/messages'
    }
  ];

  constructor(private router: Router) {}

  open(card: IFakerHubCard): void {
    this.router.navigateByUrl(card.route);
  }
}
