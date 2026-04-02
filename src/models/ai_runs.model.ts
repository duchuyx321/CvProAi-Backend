import {
    BelongsTo,
    Column,
    DataType,
    ForeignKey,
    HasOne,
    Model,
    PrimaryKey,
    Table,
} from 'sequelize-typescript';

import { Users, Cvs, Ai_results } from '~/models';

export enum ai_run_status {
    QUEUED = 'QUEUED',
    RUNNING = 'RUNNING',
    SUCCESS = 'SUCCESS',
    FAILED = 'FAILED',
}

@Table({
    tableName: 'ai_runs',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false,
})
export class Ai_runs extends Model<Ai_runs> {
    @PrimaryKey
    @Column({
        type: DataType.UUID,
        defaultValue: DataType.UUIDV4,
        allowNull: false,
    })
    declare id: string;

    @ForeignKey(() => Users)
    @Column({
        type: DataType.UUID,
        allowNull: false,
    })
    user_id!: string;

    @ForeignKey(() => Cvs)
    @Column({
        type: DataType.UUID,
        allowNull: true,
    })
    cv_id?: string;

    @Column({
        type: DataType.UUID,
        allowNull: true,
    })
    version_id?: string;

    @Column({
        type: DataType.STRING(255),
        allowNull: true,
    })
    job_title?: string;

    @Column({
        type: DataType.TEXT,
        allowNull: true,
    })
    job_description?: string;

    @Column({
        type: DataType.ENUM(...Object.values(ai_run_status)),
        allowNull: false,
        defaultValue: ai_run_status.QUEUED,
    })
    status!: ai_run_status;

    @Column({
        type: DataType.STRING(100),
        allowNull: true,
    })
    model?: string;

    @Column({
        type: DataType.INTEGER,
        allowNull: true,
    })
    prompt_tokens?: number;

    @Column({
        type: DataType.INTEGER,
        allowNull: true,
    })
    completion_tokens?: number;

    @Column({
        type: DataType.BIGINT,
        allowNull: true,
    })
    cost_cents?: number;

    @Column({
        type: DataType.TEXT,
        allowNull: true,
    })
    error_message?: string;

    @Column({
        type: DataType.DATE,
        allowNull: true,
    })
    finished_at?: Date;

    @BelongsTo(() => Users)
    user?: Users;

    @BelongsTo(() => Cvs)
    cv?: Cvs;

    @HasOne(() => Ai_results)
    ai_result?: Ai_results;
}
