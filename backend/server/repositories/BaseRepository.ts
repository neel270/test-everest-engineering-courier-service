import { Model, Document, FilterQuery, UpdateQuery, QueryOptions } from 'mongoose';

export abstract class BaseRepository<T extends Document> {
  protected model: Model<T>;

  constructor(model: Model<T>) {
    this.model = model;
  }

  async findById(id: string): Promise<T | null> {
    return await this.model.findById(id);
  }

  async findOne(filter: FilterQuery<T>): Promise<T | null> {
    return await this.model.findOne(filter);
  }

  async find(filter: FilterQuery<T> = {}): Promise<T[]> {
    return await this.model.find(filter);
  }

  async findWithPagination(
    filter: FilterQuery<T> = {},
    page: number = 1,
    limit: number = 10,
    sort: any = { createdAt: -1 }
  ): Promise<{ items: T[]; pagination: any }> {
    const skip = (page - 1) * limit;
    const items = await this.model
      .find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit);

    const total = await this.model.countDocuments(filter);

    return {
      items,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    };
  }

  async create(data: Partial<T>): Promise<T> {
    const document = new this.model(data);
    return await document.save();
  }

  async update(
    filter: FilterQuery<T>,
    update: UpdateQuery<T>,
    options: QueryOptions = { new: true }
  ): Promise<T | null> {
    return await this.model.findOneAndUpdate(filter, update, options);
  }

  async upsert(
    filter: FilterQuery<T>,
    update: UpdateQuery<T>
  ): Promise<T> {
    return await this.model.findOneAndUpdate(
      filter,
      update,
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  }

  async delete(filter: FilterQuery<T>): Promise<boolean> {
    const result = await this.model.deleteOne(filter);
    return result.deletedCount > 0;
  }

  async deleteMany(filter: FilterQuery<T>): Promise<number> {
    const result = await this.model.deleteMany(filter);
    return result.deletedCount;
  }

  async exists(filter: FilterQuery<T>): Promise<boolean> {
    const count = await this.model.countDocuments(filter);
    return count > 0;
  }

  async count(filter: FilterQuery<T> = {}): Promise<number> {
    return await this.model.countDocuments(filter);
  }

  async aggregate(pipeline: any[]): Promise<any[]> {
    return await this.model.aggregate(pipeline);
  }
}