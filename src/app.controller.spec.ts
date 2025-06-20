import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { GoogleSheetsService } from './services/google-sheets.service';
import { AuthGuard } from './guards/auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { UserRepository } from './repositories/user.repository';
import { JwtService } from '@nestjs/jwt';

describe('AppController', () => {
  let appController: AppController;
  let googleSheetsService: GoogleSheetsService;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        {
          provide: GoogleSheetsService,
          useValue: {
            getData: jest.fn().mockResolvedValue([['test', 'data']]),
            updateCell: jest.fn().mockResolvedValue({ success: true }),
          },
        },
        {
          provide: AuthGuard,
          useValue: {
            canActivate: jest.fn().mockReturnValue(true),
          },
        },
        {
          provide: RolesGuard,
          useValue: {
            canActivate: jest.fn().mockReturnValue(true),
          },
        },
        {
          provide: UserRepository,
          useValue: {},
        },
        {
          provide: JwtService,
          useValue: {
            verify: jest.fn(),
            sign: jest.fn(),
          },
        },
      ],
    }).compile();

    appController = app.get<AppController>(AppController);
    googleSheetsService = app.get<GoogleSheetsService>(GoogleSheetsService);
  });

  describe('root', () => {
    it('should return backend status message', () => {
      expect(appController.getHello()).toBe('OPB2B Backend is running!');
    });
  });

  describe('health', () => {
    it('should return health status', () => {
      const result = appController.getHealth();
      expect(result.status).toBe('ok');
      expect(result.environment).toBeDefined();
    });
  });

  describe('ping', () => {
    it('should return pong', () => {
      const result = appController.ping();
      expect(result.success).toBe(true);
      expect(result.message).toBe('pong');
    });
  });
});