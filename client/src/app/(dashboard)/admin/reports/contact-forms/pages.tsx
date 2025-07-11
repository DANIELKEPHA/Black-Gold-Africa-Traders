import React, { useState } from 'react';
import { useGetContactsQuery, useDeleteContactMutation } from '@/state/api';
import { toast } from "sonner";
import { FiTrash2, FiEye, FiX, FiClock, FiMail, FiUser, FiCheckCircle, FiChevronDown, FiChevronUp, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';

// Define the Contact interface
interface Contact {
    id: number;
    name: string;
    email: string;
    subject?: string;
    message: string;
    privacyConsent: boolean;
    userCognitoId?: string | null;
    createdAt: string;
}

// Define the type for the query response
interface ContactsQueryResponse {
    data: Contact[];
    total?: number; // Optional, assuming API might return total count
}

const ITEMS_PER_PAGE = 10;

const ContactSubmissions: React.FC = () => {
    const [currentPage, setCurrentPage] = useState(1);
    const { data, isLoading, error } = useGetContactsQuery(
        { page: currentPage, limit: ITEMS_PER_PAGE },
        {
            selectFromResult: ({ data, isLoading, error }) => ({
                data: data as ContactsQueryResponse | undefined,
                isLoading,
                error,
            }),
        }
    );
    const [deleteContact] = useDeleteContactMutation();
    const [selectedContact, setSelectedContact] = useState<Contact[] | null>(null);
    const [expandedEmail, setExpandedEmail] = useState<string | null>(null);

    // Group contacts by email
    const groupedContacts: { [key: string]: Contact[] } = (data?.data || []).reduce(
        (acc: { [key: string]: Contact[] }, contact: Contact) => {
            if (!acc[contact.email]) {
                acc[contact.email] = [];
            }
            acc[contact.email].push(contact);
            return acc;
        },
        {}
    );

    // Sort contacts within each email group by createdAt (most recent first)
    Object.values(groupedContacts).forEach((contacts) => {
        contacts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    });

    // Get paginated emails
    const emailList = Object.entries(groupedContacts);
    const totalEmails = emailList.length;
    const totalPages = Math.ceil(totalEmails / ITEMS_PER_PAGE);
    const paginatedEmails = emailList.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this contact submission?')) return;
        try {
            await deleteContact({ id }).unwrap();
            toast.success('Contact submission deleted successfully!');
            if (selectedContact && selectedContact.length === 1) {
                setSelectedContact(null); // Close modal if last submission is deleted
            }
        } catch (err: any) {
            toast.error(err?.data?.message || 'Failed to delete contact submission');
        }
    };

    const handleViewDetails = (contacts: Contact[]) => {
        setSelectedContact(contacts);
    };

    const closeModal = () => {
        setSelectedContact(null);
    };

    const toggleExpand = (email: string) => {
        setExpandedEmail(expandedEmail === email ? null : email);
    };

    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setCurrentPage(newPage);
            setExpandedEmail(null); // Reset expanded state on page change
        }
    };

    // Animation variants
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: { y: 0, opacity: 1, transition: { duration: 0.5 } }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                <motion.div
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.5 }}
                    className="mb-8"
                >
                    <h2 className="text-4xl font-bold text-gray-900 mb-2">Contact Submissions</h2>
                    <p className="text-gray-600">Review and manage user contact messages</p>
                </motion.div>

                {isLoading && (
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
                    </div>
                )}

                {error && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded"
                    >
                        <div className="flex">
                            <div className="flex-shrink-0">
                                <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div className="ml-3">
                                <p className="text-sm text-red-700">
                                    Error: {(error as any)?.data?.message || 'Failed to load submissions'}
                                </p>
                            </div>
                        </div>
                    </motion.div>
                )}

                {paginatedEmails.length ? (
                    <>
                        <motion.div
                            variants={containerVariants}
                            initial="hidden"
                            animate="visible"
                            className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
                        >
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Latest Subject</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Latest Submission</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                    </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                    {paginatedEmails.map(([email, contacts]: [string, Contact[]]) => {
                                        const latestContact = contacts[0]; // Most recent contact
                                        return (
                                            <React.Fragment key={email}>
                                                <motion.tr
                                                    variants={itemVariants}
                                                    whileHover={{ scale: 1.01, backgroundColor: 'rgba(249, 250, 251, 1)' }}
                                                    className="transition-colors duration-150"
                                                >
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="flex items-center">
                                                            <div className="flex-shrink-0 h-10 w-10 bg-indigo-100 rounded-full flex items-center justify-center">
                                                                <FiUser className="h-5 w-5 text-indigo-600" />
                                                            </div>
                                                            <div className="ml-4">
                                                                <div className="text-sm font-medium text-gray-900">{latestContact.name}</div>
                                                                <div className="text-sm text-gray-500">Messages: {contacts.length}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm text-gray-900 flex items-center">
                                                            <FiMail className="mr-2 text-gray-400" />
                                                            {email}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="text-sm text-gray-900">
                                                            {latestContact.subject || <span className="text-gray-400">No subject</span>}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm text-gray-500 flex items-center">
                                                            <FiClock className="mr-2 text-gray-400" />
                                                            {new Date(latestContact.createdAt).toLocaleDateString('en-US', {
                                                                month: 'short',
                                                                day: 'numeric',
                                                                year: 'numeric'
                                                            })}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                        <div className="flex justify-end space-x-2">
                                                            <button
                                                                onClick={() => handleViewDetails(contacts)}
                                                                className="p-2 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors"
                                                                title="View details"
                                                            >
                                                                <FiEye className="h-5 w-5" />
                                                            </button>
                                                            <button
                                                                onClick={() => toggleExpand(email)}
                                                                className="p-2 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors"
                                                                title={expandedEmail === email ? "Collapse" : "Expand"}
                                                            >
                                                                {expandedEmail === email ? <FiChevronUp className="h-5 w-5" /> : <FiChevronDown className="h-5 w-5" />}
                                                            </button>
                                                        </div>
                                                    </td>
                                                </motion.tr>
                                                {expandedEmail === email && (
                                                    <tr>
                                                        <td colSpan={5} className="px-6 py-4 bg-gray-50">
                                                            <div className="space-y-4">
                                                                {contacts.map((contact) => (
                                                                    <div key={contact.id} className="border-l-4 border-indigo-500 pl-4">
                                                                        <div className="text-sm text-gray-600">Message ID: {contact.id}</div>
                                                                        <div className="text-sm text-gray-900">{contact.message}</div>
                                                                        <div className="text-xs text-gray-500 mt-1">
                                                                            Submitted: {new Date(contact.createdAt).toLocaleString('en-US', {
                                                                            month: 'short',
                                                                            day: 'numeric',
                                                                            year: 'numeric',
                                                                            hour: 'numeric',
                                                                            minute: 'numeric'
                                                                        })}
                                                                        </div>
                                                                        <button
                                                                            onClick={() => handleDelete(contact.id)}
                                                                            className="text-sm text-red-600 hover:text-red-800 mt-2 flex items-center"
                                                                        >
                                                                            <FiTrash2 className="mr-1 h-4 w-4" /> Delete
                                                                        </button>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )}
                                            </React.Fragment>
                                        );
                                    })}
                                    </tbody>
                                </table>
                            </div>
                        </motion.div>

                        {/* Pagination Controls */}
                        <div className="mt-4 flex items-center justify-between">
                            <div className="text-sm text-gray-600">
                                Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to {Math.min(currentPage * ITEMS_PER_PAGE, totalEmails)} of {totalEmails} emails
                            </div>
                            <div className="flex space-x-2">
                                <button
                                    onClick={() => handlePageChange(currentPage - 1)}
                                    disabled={currentPage === 1}
                                    className="p-2 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-full disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <FiChevronLeft className="h-5 w-5" />
                                </button>
                                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                    <button
                                        key={page}
                                        onClick={() => handlePageChange(page)}
                                        className={`px-3 py-1 rounded-lg ${currentPage === page ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-indigo-50'}`}
                                    >
                                        {page}
                                    </button>
                                ))}
                                <button
                                    onClick={() => handlePageChange(currentPage + 1)}
                                    disabled={currentPage === totalPages}
                                    className="p-2 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-full disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <FiChevronRight className="h-5 w-5" />
                                </button>
                            </div>
                        </div>
                    </>
                ) : (
                    !isLoading && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12">
                            <div className="mx-auto h-24 w-24 text-gray-400 mb-4">
                                <svg className="h-full w-full" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-medium text-gray-900 mb-1">No contact submissions</h3>
                            <p className="text-gray-500">There are no contact submissions to display</p>
                        </motion.div>
                    )
                )}

                <AnimatePresence>
                    {selectedContact && (
                        <>
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="fixed inset-0 bg-gray-900 bg-opacity-50 z-40"
                                onClick={closeModal}
                            ></motion.div>

                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 20 }}
                                className="fixed inset-0 flex items-center justify-center z-50 p-4"
                            >
                                <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                                    <div className="p-6">
                                        <div className="flex justify-between items-start mb-4">
                                            <h3 className="text-2xl font-bold text-gray-900">Contact Details</h3>
                                            <button
                                                onClick={closeModal}
                                                className="p-1 text-gray-400 hover:text-gray-500 rounded-full hover:bg-gray-100"
                                            >
                                                <FiX className="h-6 w-6" />
                                            </button>
                                        </div>

                                        <div className="space-y-6">
                                            <div className="bg-gray-50 p-4 rounded-lg">
                                                <div className="text-sm font-medium text-gray-500 mb-1">Email</div>
                                                <div className="text-lg font-medium text-gray-900 flex items-center">
                                                    <FiMail className="mr-2 text-indigo-500" />
                                                    {selectedContact[0].email}
                                                </div>
                                            </div>

                                            <div className="space-y-4">
                                                {selectedContact.map((contact) => (
                                                    <div key={contact.id} className="bg-gray-50 p-4 rounded-lg">
                                                        <div className="text-sm font-medium text-gray-500 mb-1">Message ID: {contact.id}</div>
                                                        <div className="text-lg font-medium text-gray-900 flex items-center mb-2">
                                                            <FiUser className="mr-2 text-indigo-500" />
                                                            {contact.name}
                                                        </div>
                                                        {contact.subject && (
                                                            <div className="text-sm text-gray-900 mb-2">{contact.subject}</div>
                                                        )}
                                                        <div className="text-gray-900 whitespace-pre-line">{contact.message}</div>
                                                        <div className="text-sm text-gray-500 mt-2 flex items-center">
                                                            <FiClock className="mr-2 text-indigo-500" />
                                                            {new Date(contact.createdAt).toLocaleString('en-US', { timeZone: 'Africa/Nairobi' })}
                                                        </div>
                                                        <div className="text-sm text-gray-500 mt-2 flex items-center">
                                                            {contact.privacyConsent ? (
                                                                <>
                                                                    <FiCheckCircle className="mr-2 text-green-500" />
                                                                    Privacy Consent: Granted
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <FiX className="mr-2 text-red-500" />
                                                                    Privacy Consent: Not granted
                                                                </>
                                                            )}
                                                        </div>
                                                        <div className="text-sm text-gray-500 mt-2">
                                                            User ID: {contact.userCognitoId || 'N/A'}
                                                        </div>
                                                        <button
                                                            onClick={() => handleDelete(contact.id)}
                                                            className="text-sm text-red-600 hover:text-red-800 mt-2 flex items-center"
                                                        >
                                                            <FiTrash2 className="mr-1 h-4 w-4" /> Delete
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="mt-8 flex justify-end">
                                            <button
                                                onClick={closeModal}
                                                className="px-6 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                            >
                                                Close
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default ContactSubmissions;