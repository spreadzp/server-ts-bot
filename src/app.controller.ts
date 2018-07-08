import { Get, Controller } from '@nestjs/common';
import { AppService } from './app.service';
import { ServerTcpBot } from './server/server';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService ) {
  }

  @Get()
  root(): string {
    return this.appService.root();
  }
}
