import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BlogsService } from './blogs.service';
import { Blog } from './entities/blog.entity';

describe('BlogsService', () => {
  let service: BlogsService;
  const repo = {
    create: jest.fn((dto: Partial<Blog>) => ({ ...dto }) as Blog),
    save: jest.fn((blog: Blog) => Promise.resolve({ id: 1, ...blog })),
    find: jest.fn(),
    findOneBy: jest.fn(),
    remove: jest.fn((blog: Blog) => Promise.resolve(blog)),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BlogsService,
        { provide: getRepositoryToken(Blog), useValue: repo },
      ],
    }).compile();

    service = module.get<BlogsService>(BlogsService);
  });

  it('creates and saves a blog', async () => {
    const dto = { title: 't', content: 'c' };
    await expect(service.create(dto)).resolves.toEqual({ id: 1, ...dto });
    expect(repo.create).toHaveBeenCalledWith(dto);
  });

  it('throws NotFoundException when the blog does not exist', async () => {
    repo.findOneBy.mockResolvedValue(null);
    await expect(service.findOne(42)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('merges updates into the existing blog', async () => {
    repo.findOneBy.mockResolvedValue({ id: 1, title: 'old', content: 'c' });
    await service.update(1, { title: 'new' });
    expect(repo.save).toHaveBeenCalledWith({
      id: 1,
      title: 'new',
      content: 'c',
    });
  });

  it('removes an existing blog', async () => {
    const blog = { id: 1, title: 't', content: 'c' };
    repo.findOneBy.mockResolvedValue(blog);
    await service.remove(1);
    expect(repo.remove).toHaveBeenCalledWith(blog);
  });
});
