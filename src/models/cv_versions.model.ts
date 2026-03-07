import {
    BelongsTo,
    Column,
    DataType,
    ForeignKey,
    HasMany,
    Model,
    PrimaryKey,
    Table,
} from 'sequelize-typescript';

import { Cvs, Users, Cv_exports, Ai_runs } from '~/models';

@Table({ tableName: 'cv_versions', timestamps: true, underscored: true })
export class Cv_versions extends Model<Cv_versions> {
    @PrimaryKey
    @Column({
        type: DataType.UUID,
        defaultValue: DataType.UUIDV4,
        allowNull: false,
    })
    declare id: string;

    @ForeignKey(() => Cvs)
    @Column({
        type: DataType.UUID,
        allowNull: false,
    })
    cv_id!: string;

    @Column({
        type: DataType.INTEGER,
        allowNull: false,
    })
    version_no!: number;

    @Column({
        type: DataType.JSONB,
        allowNull: false,
    })
    content!: Record<string, any>;

    @ForeignKey(() => Users)
    @Column({
        type: DataType.UUID,
        allowNull: true,
    })
    created_by?: string;

    @Column({
        type: DataType.DATE,
        allowNull: false,
        defaultValue: DataType.NOW,
    })
    created_at!: Date;

    @BelongsTo(() => Cvs)
    cv?: Cvs;

    @BelongsTo(() => Users, 'created_by')
    creator?: Users;

    @HasMany(() => Cv_exports, 'version_id')
    cv_exports?: Cv_exports[];

    @HasMany(() => Ai_runs, 'version_id')
    ai_runs?: Ai_runs[];
}
