import {
    BelongsTo,
    Column,
    DataType,
    ForeignKey,
    Model,
    PrimaryKey,
    Table,
    Unique,
} from 'sequelize-typescript';

import { Ai_runs } from '~/models';

@Table({ tableName: 'ai_results', timestamps: true, underscored: true })
export class Ai_results extends Model<Ai_results> {
    @PrimaryKey
    @Column({
        type: DataType.UUID,
        defaultValue: DataType.UUIDV4,
        allowNull: false,
    })
    declare id: string;

    @Unique
    @ForeignKey(() => Ai_runs)
    @Column({
        type: DataType.UUID,
        allowNull: false,
    })
    ai_run_id!: string;

    @Column({
        type: DataType.DECIMAL(5, 2),
        allowNull: true,
    })
    overall_score?: number;

    @Column({
        type: DataType.DECIMAL(5, 2),
        allowNull: true,
    })
    ats_score?: number;

    @Column({
        type: DataType.DECIMAL(5, 2),
        allowNull: true,
    })
    clarity_score?: number;

    @Column({
        type: DataType.DECIMAL(5, 2),
        allowNull: true,
    })
    impact_score?: number;

    @Column({
        type: DataType.JSONB,
        allowNull: true,
    })
    strengths?: any[];

    @Column({
        type: DataType.JSONB,
        allowNull: true,
    })
    weaknesses?: any[];

    @Column({
        type: DataType.JSONB,
        allowNull: true,
    })
    suggestions?: any[];

    @Column({
        type: DataType.JSONB,
        allowNull: true,
    })
    structured_feedback?: Record<string, any>;

    @BelongsTo(() => Ai_runs)
    ai_run?: Ai_runs;
}
