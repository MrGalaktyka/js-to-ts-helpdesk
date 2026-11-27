import { gettickets, setticketCounter } from '../script.ts';
import { saveToStorage, filter } from './listLogic.ts';



export function initImport() {
    const fileInput = document.getElementById("fileInput") as HTMLInputElement;
    if (!fileInput) return;

    document.getElementById("fileInput")!.addEventListener("change", function() {
    if (this.files.length > 0) {
        showImportWindow();
    }
    });

    document.getElementById("cancel")!.addEventListener("click", function() {

        cancelImport();

    });

    document.getElementById("confirm")!.addEventListener("click", function() {

        confirmImport();

    });

    function showImportWindow() {
    document.getElementById("importConfirm")!.style.display = "flex";
    document.getElementById("message_import_confirm")!.textContent = `file: ${fileInput.files?.[0].name}`;
    }

    function cancelImport() {
        document.getElementById("importConfirm")!.style.display = "none";
        fileInput.value = "";
    }

    function confirmImport() {
        document.getElementById("importConfirm")!.style.display = "none";
        listImport();
    }

    async function listImport() {
        const messageEl = document.getElementById("message_import");

        try {
        const file = fileInput.files?.[0];

        if (!file) {
            throw new Error("No file selected");
        }

        const extension = file?.name.split(".").pop()?.toLowerCase();
        const text = await file.text();
        let data

        switch(extension) {
            case "json": {
                data = JSON.parse(text);
                break;
            }
            case "csv": {
                const lines = text.trim().split(/\r?\n/)
                const headers = lines[0].split(",").map(h => h.trim());
                const requiredHeaders = ["id", "title", "status", "priority"];
                
                if (!requiredHeaders.every(header => headers.includes(header))) {
                    throw new Error("CSV must contain: id, title, status, priority");
                }

                data = lines.slice(1).map(line => {
                    const values = line.split(",");
                    const ticket = {};

                    headers.forEach((header, index) => {
                        ticket[header] = values[index]?.trim() ?? "";
                    });
                    return ticket;
                })
                break;
            }
            case "xml": {
                const parser = new DOMParser();
                const xml = parser.parseFromString(text, "application/xml");

                if (xml.querySelector("parsererror")) {
                    throw new Error("Invalid XML file");
                }
                if (xml.documentElement.tagName !== "tickets") {
                    throw new Error("Invalid XML structure");
                }

                const ticketElements = xml.querySelectorAll("tickets > ticket");

                data = Array.from(ticketElements).map(ticket => ({
                    id: ticket.getAttribute("id"),
                    title: ticket.querySelector("title")?.textContent ?? "",
                    status: ticket.querySelector("status")?.textContent ?? "",
                    priority: ticket.querySelector("priority")?.textContent ?? ""
                }))
                break;
            }
            default: {
                throw new Error("Invalid file extension. Only JSON, CSV and XML files are allowed.");
            }
        }

        if (data === null || typeof data !== "object" || !Array.isArray(data)) {
            throw new Error("File must contain an array");
        }

        if (data.length >= 1000) {
            throw new Error("File can't contain more than 1000 tickets");
        }

        data.forEach(function(ticket) {
            if (ticket === null || typeof ticket !== "object" || Array.isArray(ticket)) {
                throw new Error("Ticket must be an object");
            }
            
            if (typeof ticket.id !== "string" || typeof ticket.title !== "string" || typeof ticket.status !== "string" || typeof ticket.priority !== "string") {
                throw new Error("Invalid data structure");
            }

            if (!ticket.id || ticket.id.trim().length === 0 || ticket.id.length > 100) {
                throw new Error("Invalid ticket Id");
            }

            if (ticket.title.trim().length < 3 || ticket.title.trim().length > 80) {
                throw new Error("The title must be between 3 and 80 characters long.");
            }

            if (ticket.status !== 'new' && ticket.status !== 'doing' && ticket.status !== 'done') {
                throw new Error("Invalid ticket Status");
            }

            if (ticket.priority !== 'low' && ticket.priority !== 'normal' && ticket.priority !== 'high') {
                throw new Error("Invalid ticket Priority");
            }
        })
        
        
        const ids = data.map(ticket => ticket.id);
            if (new Set(ids).size !== ids.length) {
                throw new Error("Ticket IDs must be unique");
            }

            const newTickets = data.map(ticket => ({
                id: ticket.id,
                title: ticket.title.trim(),
                status: ticket.status,
                priority: ticket.priority
            }));

            const currentTickets = gettickets();
            currentTickets.length = 0;
            currentTickets.push(...newTickets);

        const numericIds = currentTickets.map(ticket => Number(ticket.id)).filter(id => Number.isSafeInteger(id) && id >= 0);

        setticketCounter(Math.max(0, ...numericIds) + 1);

        saveToStorage();
        const form = document.getElementById('ticketForm') as HTMLFormElement
        form.reset();
        filter();
        document.getElementById("message_import")!.textContent = "Import succesful";
    } catch (error) {
        const err = error as Error;
        document.getElementById("message_import")!.textContent = err.message;
    }
    }
}