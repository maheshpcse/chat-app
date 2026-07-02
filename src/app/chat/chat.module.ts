import { NgModule } from '@angular/core';
import { TextFieldModule } from '@angular/cdk/text-field';
import { SharedModule } from '../shared/shared.module';
import { ChatRoutingModule } from './chat-routing.module';
import { ChatContainerComponent } from './chat-container/chat-container.component';
import { ChatWindowComponent } from './chat-window/chat-window.component';
import { MessageBubbleComponent } from './message-bubble/message-bubble.component';
import { MessageInputComponent } from './message-input/message-input.component';
import { TypingIndicatorComponent } from './typing-indicator/typing-indicator.component';

@NgModule({
  declarations: [
    ChatContainerComponent,
    ChatWindowComponent,
    MessageBubbleComponent,
    MessageInputComponent,
    TypingIndicatorComponent
  ],
  imports: [
    SharedModule,
    ChatRoutingModule,
    TextFieldModule
  ]
})
export class ChatModule {}
