import {
    BelongsTo,
    Column,
    DataType,
    ForeignKey,
    Model,
    PrimaryKey,
    Table,
} from 'sequelize-typescript';

import { Ai_runs } from '~/models';

@Table({ tableName: 'ai_results', timestamps: false, underscored: true })
export class Ai_results extends Model<Ai_results> {
    @PrimaryKey
    @Column({
        type: DataType.UUID,
        defaultValue: DataType.UUIDV4,
        allowNull: false,
    })
    declare id: string;

    @ForeignKey(() => Ai_runs)
    @Column({ type: DataType.UUID, allowNull: false, unique: true })
    ai_run_id!: string;

    @Column({ type: DataType.DECIMAL(5, 2), allowNull: true })
    overall_score?: string;

    @Column({ type: DataType.DECIMAL(5, 2), allowNull: true })
    ats_score?: string;

    @Column({ type: DataType.DECIMAL(5, 2), allowNull: true })
    clarity_score?: string;

    @Column({ type: DataType.DECIMAL(5, 2), allowNull: true })
    impact_score?: string;

    @Column({ type: DataType.JSONB, allowNull: true })
    strengths?: any;

    @Column({ type: DataType.JSONB, allowNull: true })
    weaknesses?: any;

    @Column({ type: DataType.JSONB, allowNull: true })
    suggestions?: any;

    @Column({ type: DataType.JSONB, allowNull: true })
    structured_feedback?: any;

    @Column({
        type: DataType.DATE,
        allowNull: false,
        defaultValue: DataType.NOW,
    })
    created_at!: Date;

    @BelongsTo(() => Ai_runs)
    run?: Ai_runs;
}
