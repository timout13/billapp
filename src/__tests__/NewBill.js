/**
 * @jest-environment jsdom
 */

import NewBillUI from "../views/NewBillUI.js"
import NewBill from "../containers/NewBill.js"
import {screen, fireEvent, waitFor} from "@testing-library/dom";
import {ROUTES, ROUTES_PATH} from "../constants/routes.js";
import mockStore from "../__mocks__/store";
import {localStorageMock} from "../__mocks__/localStorage.js";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import router from "../app/Router.js";

jest.mock("../app/store", () => mockStore);

const setupNewBill = (initialValues = {}) => {
    const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({pathname});
    };
    const html = NewBillUI();
    document.body.innerHTML = html;
    const newBillInit = new NewBill({
        document,
        onNavigate,
        store: mockStore,
        localStorage: window.localStorage,
    });
    Object.assign(newBillInit, initialValues);
    return {newBillInit};
};

describe("Given I am connected as an employee", () => {
    describe("When I am on NewBill Page", () => {
        beforeEach(() => {
            jest.spyOn(mockStore, "bills");
            Object.defineProperty(window, "localStorage", {value: localStorageMock});
            window.localStorage.setItem("user", JSON.stringify({
                type: "Employee",
                email: "employee@test.tld"
            }));
            Object.defineProperty(window, "location", {value: {hash: ROUTES_PATH["NewBill"]}});
            const root = document.createElement("div");
            root.setAttribute("id", "root");
            document.body.appendChild(root);
            router();
        })

        test("Then handleChangeFile should be called on submission of a file & return values", async () => {
            const {newBillInit} = setupNewBill();

            const file = new File(["image"], "image.png", {type: "image/png"});
            const handleChangeFile = jest.fn((e) => newBillInit.handleChangeFile(e));
            const billFile = screen.getByTestId("file");

            billFile.addEventListener("change", (e) => handleChangeFile(e));
            userEvent.upload(billFile, file);
            await waitFor(() => {
                expect(newBillInit.billId).toBe("1234");
                expect(newBillInit.fileUrl).toBe("https://localhost:3456/images/test.jpg");
                expect(newBillInit.fileName).toBe("image.png");
            }, {timeout: 1000});


            expect(billFile.files[0].name).toBeDefined();
            expect(handleChangeFile).toBeCalled();
        });
    })
    test("Then update() method of store should be called on form submission & return values", async () => {
        window.localStorage.setItem("user", JSON.stringify({
            type: "Employee",
            email: "a@a"
        }));
        const {newBillInit} = setupNewBill({
            fileUrl: "https://firebasestorage.googleapis.com/v0/b/billable-677b6.a…f-1.jpg?alt=media&token=c1640e12-a24b-4b11-ae52-529112e9602a",
            fileName: "preview-facture-free-201801-pdf-1.jpg"
        });

        const newBill = {
            "vat": "80",
            "fileUrl": "https://firebasestorage.googleapis.com/v0/b/billable-677b6.a…f-1.jpg?alt=media&token=c1640e12-a24b-4b11-ae52-529112e9602a",
            "status": "pending",
            "type": "Hôtel et logement",
            "commentary": "séminaire billed",
            "name": "encore",
            "fileName": "preview-facture-free-201801-pdf-1.jpg",
            "date": "2004-04-04",
            "amount": 400,
            "email": "a@a",
            "pct": 20
        };

        const mockUpdate = jest.spyOn(mockStore.bills(), "update");
        const handleSubmit = jest.spyOn(newBillInit, 'handleSubmit');
        const newBillInitUpdate = jest.spyOn(newBillInit, 'updateBill');

        screen.getByTestId("expense-name").value = newBill.name;
        screen.getByTestId("amount").value = newBill.amount;
        screen.getByTestId("datepicker").value = newBill.date;
        screen.getByTestId("vat").value = newBill.vat;
        screen.getByTestId("pct").value = newBill.pct;
        screen.getByTestId("commentary").value = newBill.commentary;
        screen.getByText("Hôtel et logement").setAttribute("selected", true);

        const formNewBill = screen.getByTestId("form-new-bill");
        formNewBill.addEventListener("submit", handleSubmit);
        fireEvent.submit(formNewBill);


        expect(handleSubmit).toHaveBeenCalled();
        expect(newBillInitUpdate).toHaveBeenCalledWith(newBill);
        newBill.id = "47qAXb6fIm2zOKkLzMro";
        newBill.commentAdmin = "ok";
        await mockUpdate.mock.results[0].value.then(result => {
            expect(result).toEqual(newBill);
        });
    });
})