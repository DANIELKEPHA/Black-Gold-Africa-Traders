import { useGetReportsQuery } from '../api';
import { Table } from './Table'; // Reused from StocksPage.tsx

const ReportsPage = () => {
    const { data: catalogs, isLoading: catalogsLoading } = useGetReportsQuery({ type: 'CATALOG' });
    const { data: sellingPrices, isLoading: pricesLoading } = useGetReportsQuery({ type: 'SELLING_PRICE' });
    const { data: outLots, isLoading: outLotsLoading } = useGetReportsQuery({ type: 'OUT_LOTS' });

    if (catalogsLoading || pricesLoading || outLotsLoading) return <div>Loading...</div>;

    const columns = [
        { key: 'lotNo', header: 'Lot No' },
        { key: 'broker', header: 'Broker' },
        { key: 'sellingMark', header: 'Selling Mark' },
        { key: 'grade', header: 'Grade' },
        { key: 'bags', header: 'Bags' },
        { key: 'netWeight', header: 'Net Weight' },
        { key: 'totalWeight', header: 'Total Weight' },
        { key: 'askingPrice', header: 'Asking Price' },
        { key: 'purchasePrice', header: 'Purchased Price' },
        { key: 'baselinePrice', header: 'Baseline Price' },
        { key: 'producerCountry', header: 'Country' },
        { key: 'manufactureDate', header: 'Manufactured', render: (date) => new Date(date).toLocaleDateString() },
    ];

    return (
        <div>
            <h2>Catalog</h2>
            <Table data={catalogs || []} columns={columns} />
            <h2>Selling Prices</h2>
            <Table data={sellingPrices || []} columns={columns} />
            <h2>Out Lots</h2>
            <Table data={outLots || []} columns={columns} />
        </div>
    );
};

export default ReportsPage;