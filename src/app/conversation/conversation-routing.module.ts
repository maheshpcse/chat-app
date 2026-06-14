import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { ConversationListComponent } from './conversation-list/conversation-list.component';
import { NewConversationComponent } from './new-conversation/new-conversation.component';

/**
 * Conversation Routing Module
 * - '' → Conversation list
 * - 'new' → Create new conversation (search users)
 */
const routes: Routes = [
  { path: '', component: ConversationListComponent },
  { path: 'new', component: NewConversationComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ConversationRoutingModule {}
