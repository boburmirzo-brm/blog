import { Test, TestingModule } from '@nestjs/testing';
import { BlogsController } from './blogs.controller';
import { BlogsService } from './blogs.service';

describe('BlogsController', () => {
  let controller: BlogsController;
  const service = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BlogsController],
      providers: [{ provide: BlogsService, useValue: service }],
    }).compile();

    controller = module.get<BlogsController>(BlogsController);
  });

  it('converts the id param to a number', async () => {
    await controller.findOne('7');
    expect(service.findOne).toHaveBeenCalledWith(7);

    await controller.update('7', { title: 'x' });
    expect(service.update).toHaveBeenCalledWith(7, { title: 'x' });

    await controller.remove('7');
    expect(service.remove).toHaveBeenCalledWith(7);
  });
});
