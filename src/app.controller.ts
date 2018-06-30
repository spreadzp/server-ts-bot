import { Get, Controller } from '@nestjs/common';
import { AppService } from './app.service';
import { ServerTcpBot } from './server/server';

@Controller()
export class AppController {
  setverTcp: ServerTcpBot;
  constructor(private readonly appService: AppService) {
    this.setverTcp = new ServerTcpBot();
  }

  @Get()
  root(): string {
    return this.appService.root();
  }

  @Get('start-server')
  startTcpServer() {
    this.setverTcp.createTcpServer();
  }

  @Get('stop-server')
  stopTcpServer() {
    this.setverTcp.stopTcpServer();
  }
}
