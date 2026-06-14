import { NgModule } from '@angular/core';
import { SharedModule } from '../shared/shared.module';
import { ConversationRoutingModule } from './conversation-routing.module';
import { ConversationListComponent } from './conversation-list/conversation-list.component';
import { ConversationItemComponent } from './conversation-item/conversation-item.component';
import { NewConversationComponent } from './new-conversation/new-conversation.component';

/**
 * ConversationModule - Feature module for conversation management.
 * Lazy-loaded when user navigates to /conversations.
 *
 * Angular Concepts Used:
 * - Feature module with dedicated routing
 * - SharedModule import for Material + common components
 * - Component composition (list uses item component)
 */
@NgModule({
  declarations: [
    ConversationListComponent,
    ConversationItemComponent,
    NewConversationComponent
  ],
  imports: [
    SharedModule,
    ConversationRoutingModule
  ],
  exports: [
    ConversationItemComponent
  ]
})
export class ConversationModule {}
