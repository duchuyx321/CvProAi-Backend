import {
    Column,
    DataType,
    HasMany,
    Model,
    PrimaryKey,
    Table,
} from 'sequelize-typescript';
import { Cvs } from '~/models';

@Table({ tableName: 'cv_templates', timestamps: true, underscored: true })
export class Cv_templates extends Model<Cv_templates> {
    @PrimaryKey
    @Column({
        type: DataType.UUID,
        defaultValue: DataType.UUIDV4,
        allowNull: false,
    })
    declare id: string;
    @Column({ type: DataType.STRING, unique: true, allowNull: false })
    code!: string;
    @Column({ type: DataType.STRING, allowNull: false })
    name!: string;
    @Column({ type: DataType.STRING, allowNull: true })
    preview_url?: string;
    @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: false })
    is_premium!: boolean;
    @Column({ type: DataType.JSON, allowNull: true })
    config?: Record<string, any>;

    @HasMany(() => Cvs)
    cvs?: Cvs[];
}
